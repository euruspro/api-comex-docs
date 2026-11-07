import {copyFile, mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';

import type {LoadContext, Plugin} from '@docusaurus/types';

/**
 * Genera `/llms.txt`: un índice compacto de la API pensado para que lo lea una
 * IA (convención https://llmstxt.org), y publica el spec completo junto a él.
 *
 * QUÉ ENTRA: solo lo que el spec público declara, filtrado por dos reglas:
 *   - método `GET`;
 *   - operación no marcada `deprecated: true`.
 *
 * Es una lista de permitidos, no de excluidos: una ruta del backend aparece acá
 * solo si alguien la documentó en `openapi/comex.yaml`. Por eso el índice se
 * deriva del spec y no del router de Express, que expondría todo lo que monta.
 *
 * Se genera en `postBuild` y no se commitea: así no puede divergir del spec que
 * se desplegó en el mismo build.
 */

/** Opciones del plugin. */
export interface ILlmsTxtOptions {
  /** Ruta al spec OpenAPI, relativa al `siteDir`. */
  specPath: string;
  /** Ruta pública con la que se publica el spec, relativa a la raíz del sitio. */
  specPublicPath: string;
  /** Título del índice (H1). Es propio del índice: no se toma de `info.title`. */
  title: string;
}

/** Subconjunto del spec OpenAPI que usa el generador. */
interface IOpenApiParameter {
  $ref?: string;
  name?: string;
  in?: string;
  required?: boolean;
}

interface IOpenApiOperation {
  operationId?: string;
  summary?: string;
  deprecated?: boolean;
  tags?: string[];
  parameters?: IOpenApiParameter[];
}

interface IOpenApiTag {
  name: string;
  description?: string;
}

interface IOpenApiSpec {
  info?: {version?: string};
  servers?: {url?: string}[];
  tags?: IOpenApiTag[];
  components?: {parameters?: Record<string, IOpenApiParameter>};
  paths?: Record<string, Record<string, unknown>>;
}

/** Operación publicable, ya filtrada y lista para describir. */
interface IPublishedOperation {
  route: string;
  method: string;
  tag: string;
  op: IOpenApiOperation;
}

/** Métodos que se publican. Cualquier otro queda fuera del índice. */
const PUBLISHED_METHODS = new Set(['get']);

/**
 * Forma obligatoria de la base URL: `https://<host>/{idAgencia}/v1`.
 * Todas las rutas del índice son relativas a ella, así que una base distinta
 * (sin `{idAgencia}`, con otra versión o sin TLS) dejaría mal todas las rutas.
 */
const BASE_URL_PATTERN = /^https:\/\/[a-z0-9.-]+\/\{idAgencia\}\/v1$/;

/**
 * Valida y devuelve la base URL del spec (`servers[0].url`).
 * Lanza si falta o no tiene la forma `https://<host>/{idAgencia}/v1`.
 */
export function resolveBaseUrl(spec: IOpenApiSpec): string {
  const baseUrl = spec.servers?.[0]?.url;
  if (!baseUrl) throw new Error('llms-txt: el spec no declara servers[0].url');
  if (!BASE_URL_PATTERN.test(baseUrl)) {
    throw new Error(`llms-txt: servers[0].url debe ser https://<host>/{idAgencia}/v1, y es "${baseUrl}"`);
  }

  return baseUrl;
}

/**
 * Resuelve un `$ref` local a `#/components/parameters/<nombre>`.
 * Lanza si no existe: un parámetro sin resolver dejaría la ruta mal descrita.
 */
function resolveParameter(spec: IOpenApiSpec, param: IOpenApiParameter): IOpenApiParameter {
  if (!param.$ref) return param;

  const prefix = '#/components/parameters/';
  const name = param.$ref.startsWith(prefix) ? param.$ref.slice(prefix.length) : undefined;
  const resolved = name ? spec.components?.parameters?.[name] : undefined;
  if (!resolved) throw new Error(`llms-txt: no se pudo resolver el parámetro ${param.$ref}`);

  return resolved;
}

/** Línea de una operación: método, ruta con query obligatoria, resumen y opcionales. */
function describeOperation(spec: IOpenApiSpec, {route, method, op}: IPublishedOperation): string {
  const params = (op.parameters ?? []).map((p) => resolveParameter(spec, p));
  const query = params.filter((p) => p.in === 'query');
  const required = query.filter((p) => p.required).map((p) => `${p.name}={${p.name}}`);
  const optional = query.filter((p) => !p.required).map((p) => p.name);

  const target = required.length > 0 ? `${route}?${required.join('&')}` : route;
  const extra = optional.length > 0 ? ` Opcionales: ${optional.join(', ')}.` : '';

  return `- \`${method.toUpperCase()} ${target}\`: ${op.summary ?? op.operationId ?? ''}.${extra}`;
}

/** Primera oración de la descripción de un tag, en una línea. */
function firstSentence(text: string | undefined): string {
  const flat = (text ?? '').replace(/\s+/g, ' ').trim();
  const match = /^(.+?\.)(?:\s|$)/.exec(flat);

  return match ? match[1] : flat;
}

/**
 * Operaciones publicables: `GET` y no `deprecated`.
 * Lanza si una no tiene tag, porque el índice agrupa por tag y una ruta
 * suelta quedaría sin el contexto de su recurso.
 */
function collectOperations(spec: IOpenApiSpec): IPublishedOperation[] {
  const operations: IPublishedOperation[] = [];

  for (const [route, item] of Object.entries(spec.paths ?? {})) {
    for (const [method, value] of Object.entries(item)) {
      if (!PUBLISHED_METHODS.has(method)) continue;
      const op = value as IOpenApiOperation;
      if (op.deprecated === true) continue;

      const tag = op.tags?.[0];
      if (!tag) throw new Error(`llms-txt: ${method.toUpperCase()} ${route} no declara tag`);
      operations.push({route, method, tag, op});
    }
  }

  return operations;
}

/**
 * Agrupa las operaciones por recurso (tag), en el orden en que el spec
 * declara sus `tags`, y dentro de cada uno por ruta. Un tag usado por una
 * operación pero no declarado en `tags` va al final, sin descripción.
 */
function renderGroups(spec: IOpenApiSpec, operations: IPublishedOperation[]): string[] {
  const declared = spec.tags ?? [];
  const used = [...new Set(operations.map((o) => o.tag))];
  const order = [
    ...declared.filter((t) => used.includes(t.name)),
    ...used.filter((name) => !declared.some((t) => t.name === name)).map((name) => ({name})),
  ];

  return order.flatMap((tag: IOpenApiTag) => {
    const lines = operations
      .filter((o) => o.tag === tag.name)
      .sort((a, b) => a.route.localeCompare(b.route, 'en'))
      .map((o) => describeOperation(spec, o));
    const description = firstSentence(tag.description);

    return [`### ${tag.name}`, '', ...(description ? [description, ''] : []), ...lines, ''];
  });
}

/**
 * Construye el contenido de `llms.txt` a partir del spec.
 * Función pura: no lee ni escribe archivos.
 *
 * @param spec - Spec OpenAPI ya parseado
 * @param title - Título del índice
 * @param siteUrl - URL pública del portal, sin `/` final
 * @param specPublicPath - Ruta pública del spec completo
 * @returns Texto Markdown del índice
 */
export function buildLlmsTxt(spec: IOpenApiSpec, title: string, siteUrl: string, specPublicPath: string): string {
  const baseUrl = resolveBaseUrl(spec);
  const operations = collectOperations(spec);

  // Un índice vacío se publicaría como "la API no tiene rutas": mejor romper el build.
  if (operations.length === 0) throw new Error('llms-txt: el spec no tiene operaciones publicables');

  return [
    `# ${title}`,
    '',
    '> API REST de solo lectura para consultar los despachos de comercio exterior (Chile) de una',
    '> Agencia de Aduanas que usa EURUS PRO®: estado, datos, documentos y desembolsos.',
    `> Spec ${spec.info?.version ?? ''}.`,
    '',
    '## Uso',
    '',
    `- Base URL: \`${baseUrl}\`. \`{idAgencia}\` lo asigna EURUS PRO®. Las rutas de abajo son relativas a ella.`,
    '- Autenticación: header `x-api-key: <API_KEY>` (recomendado) o query `?key=<API_KEY>`. Una de las dos.',
    '- Solo servidor a servidor: no hay CORS.',
    '- `rut` del cliente final (cuerpo + dígito verificador) en `/dispatch/*` y `/files`. Acota lo que se ve.',
    '- Errores en JSON: `{status, code, message, requestId}`. Discriminar por `code`, no por `message`.',
    '- `403`: API Key o `idAgencia` inválidos (también si falta la key). `404`: no existe o no es de ese `rut`.',
    '',
    '## Endpoints',
    '',
    ...renderGroups(spec, operations),
    '## Referencia',
    '',
    `- [Spec OpenAPI completo](${siteUrl}/${specPublicPath}): parámetros, esquemas y ejemplos de cada endpoint.`,
    `- [Convenciones](${siteUrl}/docs/conventions): formato de RUT, fechas, paginación y claves opcionales.`,
    `- [Errores](${siteUrl}/docs/errors): catálogo de códigos.`,
    '',
  ].join('\n');
}

/**
 * Plugin de Docusaurus. Escribe `llms.txt` y copia el spec en el build del
 * locale por defecto: los dos son independientes del idioma del portal y
 * publicarlos por locale los duplicaría bajo `/en/`.
 */
export default function llmsTxtPlugin(context: LoadContext, options: ILlmsTxtOptions): Plugin {
  return {
    name: 'llms-txt',
    async postBuild({outDir}) {
      if (context.i18n.currentLocale !== context.i18n.defaultLocale) return;

      // Import diferido: solo se necesita en el build, no al cargar la config.
      const {load} = await import('js-yaml');
      const specFile = path.join(context.siteDir, options.specPath);
      const spec = load(await readFile(specFile, 'utf8')) as IOpenApiSpec;

      const siteUrl = context.siteConfig.url.replace(/\/+$/, '');
      const content = buildLlmsTxt(spec, options.title, siteUrl, options.specPublicPath);

      const specTarget = path.join(outDir, options.specPublicPath);
      await mkdir(path.dirname(specTarget), {recursive: true});
      await Promise.all([
        writeFile(path.join(outDir, 'llms.txt'), content, 'utf8'),
        copyFile(specFile, specTarget),
      ]);
    },
  };
}
