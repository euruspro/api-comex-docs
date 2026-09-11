#!/usr/bin/env node
/**
 * Restaura `docs/reference/sidebar.ts` después de `docusaurus clean-api-docs`.
 *
 * ## El problema que resuelve
 *
 * `docs/reference/**` está en .gitignore porque se regenera desde el spec, con
 * una excepción: `sidebar.ts`, que sí está trackeado. Pero `clean-api-docs`
 * borra el directorio entero, y `gen-api-docs` NO lo recrea —el plugin solo
 * escribe ese archivo si se configura `sidebarOptions`, y acá no se configura—.
 *
 * El resultado es que la secuencia documentada (`clean` y después `gen`) deja
 * el repo sin un archivo que `sidebars.ts` importa, y el sitio deja de cargar:
 *
 *   [ERROR] Sidebars file at "sidebars.ts" failed to be loaded.
 *   [ERROR] Unable to build website for locale es.
 *
 * El error no menciona el archivo borrado, así que la causa no es evidente.
 * Por eso `clean-api-docs:comex` encadena este script.
 *
 * Es idempotente: escribe siempre el mismo contenido, así que correrlo de más
 * no ensucia el working tree.
 */

const fs = require('node:fs');
const path = require('node:path');

const DESTINO = path.join(__dirname, '..', 'docs', 'reference', 'sidebar.ts');

const CONTENIDO = `// Stub del sidebar de la referencia OpenAPI.
//
// No es un placeholder que algo vaya a reemplazar: es el archivo definitivo.
// \`docusaurus-plugin-openapi-docs\` solo genera un sidebar si se configura
// \`sidebarOptions\`, y acá no se configura — las páginas de referencia se
// enlazan a mano desde docs/documentacion/index.md.
//
// Está trackeado en git (ver la excepción en .gitignore), pero
// \`clean-api-docs\` lo borra junto con el resto de docs/reference/. Por eso
// \`clean-api-docs:comex\` encadena scripts/restore-sidebar-stub.js: sin este
// archivo, sidebars.ts no puede importar y el sitio deja de cargar.

const sidebar: any[] = [];

export default sidebar;
`;

try {
  fs.mkdirSync(path.dirname(DESTINO), { recursive: true });
  fs.writeFileSync(DESTINO, CONTENIDO, 'utf8');
  console.log('Stub del sidebar restaurado en docs/reference/sidebar.ts');
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: no se pudo restaurar docs/reference/sidebar.ts — ${message}`);
  process.exit(1);
}
