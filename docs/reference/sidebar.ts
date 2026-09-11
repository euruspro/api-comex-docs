// Stub del sidebar de la referencia OpenAPI.
//
// No es un placeholder que algo vaya a reemplazar: es el archivo definitivo.
// `docusaurus-plugin-openapi-docs` solo genera un sidebar si se configura
// `sidebarOptions`, y acá no se configura — las páginas de referencia se
// enlazan a mano desde docs/documentacion/index.md.
//
// Está trackeado en git (ver la excepción en .gitignore), pero
// `clean-api-docs` lo borra junto con el resto de docs/reference/. Por eso
// `clean-api-docs:comex` encadena scripts/restore-sidebar-stub.js: sin este
// archivo, sidebars.ts no puede importar y el sitio deja de cargar.

const sidebar: any[] = [];

export default sidebar;
