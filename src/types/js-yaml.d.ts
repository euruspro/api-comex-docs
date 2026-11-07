/**
 * Tipos mínimos de `js-yaml` para `src/plugins/llms-txt.ts`.
 *
 * Se declara solo lo que se usa en vez de sumar `@types/js-yaml`: `load`
 * devuelve `unknown` y el plugin lo acota a su propia interfaz del spec.
 */
declare module 'js-yaml' {
  export function load(input: string): unknown;
}
