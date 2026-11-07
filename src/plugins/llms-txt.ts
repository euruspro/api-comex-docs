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
  parameters?: IOpenApiParameter[];
}

interface IOpenApiSpec {
  info?: {title?: string; version?: string};
  servers?: {url?: string}[];
  components?: {parameters?: Record<string, IOpenApiParameter>};
  paths?: Record<string, Record<string, unknown>>;
}

/** Métodos que se publican. Cualquier otro queda fuera del índice. */
const PUBLISHED_METHODS = new Set(['get']);

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
function describeOperation(spec: IOpenApiSpec, route: string, method: string, op: IOpenApiOperation): string {
  const params = (op.parameters ?? []).map((p) => resolveParameter(spec, p));
  const query = params.filter((p) => p.in === 'query');
  const required = query.filter((p) => p.required).map((p) => `${p.name}={${p.name}}`);
  const optional = query.filter((p) => !p.required).map((p) => p.name);

  const target = required.length > 0 ? `${route}?${required.join('&')}` : route;
  const extra = optional.length > 0 ? ` Opcionales: ${optional.join(', ')}.` : '';

  return `- \`${method.toUpperCase()} ${target}\`: ${op.summary ?? op.operationId ?? ''}.${extra}`;
}

/**
 * Construye el contenido de `llms.txt` a partir del spec.
 * Función pura: no lee ni escribe archivos.
 *
 * @param spec - Spec OpenAPI ya parseado
 * @param siteUrl - URL pública del portal, sin `/` final
 * @param specPublicPath - Ruta pública del spec completo
 * @returns Texto Markdown del índice
 */
export function buildLlmsTxt(spec: IOpenApiSpec, siteUrl: string, specPublicPath: string): string {
  const lines: string[] = [];

  for (const [route, item] of Object.entries(spec.paths ?? {})) {
    for (const [method, value] of Object.entries(item)) {
      if (!PUBLISHED_METHODS.has(method)) continue;
      const op = value as IOpenApiOperation;
      if (op.deprecated === true) continue;
      lines.push(describeOperation(spec, route, method, op));
    }
  }

  // Un índice vacío se publicaría como "la API no tiene rutas": mejor romper el build.
  if (lines.length === 0) throw new Error('llms-txt: el spec no tiene operaciones publicables');

  const baseUrl = spec.servers?.[0]?.url;
  if (!baseUrl) throw new Error('llms-txt: el spec no declara servers[0].url');

  return [
    `# ${spec.info?.title ?? 'API Comex'}`,
    '',
    '> API REST de solo lectura para consultar despachos de comercio exterior (Chile) de una agencia',
    `> EURUS PRO®: estado, datos, documentos y desembolsos. Spec ${spec.info?.version ?? ''}.`,
    '',
    '## Uso',
    '',
    `- Base URL: \`${baseUrl}\`. \`{idAgencia}\` lo asigna EURUS PRO®.`,
    '- Autenticación: header `x-api-key: <API_KEY>` (recomendado) o query `?key=<API_KEY>`. Una de las dos.',
    '- Solo servidor a servidor: no hay CORS.',
    '- `rut` del cliente final (cuerpo + dígito verificador) en `/dispatch/*` y `/files`. Acota lo que se ve.',
    '- Errores en JSON: `{status, code, message, requestId}`. Discriminar por `code`, no por `message`.',
    '- `403`: API Key o `idAgencia` inválidos (también si falta la key). `404`: no existe o no es de ese `rut`.',
    '',
    '## Endpoints',
    '',
    ...lines,
    '',
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
      const content = buildLlmsTxt(spec, siteUrl, options.specPublicPath);

      const specTarget = path.join(outDir, options.specPublicPath);
      await mkdir(path.dirname(specTarget), {recursive: true});
      await Promise.all([
        writeFile(path.join(outDir, 'llms.txt'), content, 'utf8'),
        copyFile(specFile, specTarget),
      ]);
    },
  };
}
