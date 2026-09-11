# api-comex-docs

Documentación pública de la **API Comex de EURUS PRO** — centro de documentación técnica dirigido a integradores que consumen la API REST de comercio exterior de EURUS PRO.

Construido con [Docusaurus 3](https://docusaurus.io/) + [`docusaurus-plugin-openapi-docs`](https://github.com/PaloAltoNetworks/docusaurus-openapi-docs) para la referencia interactiva.

- **Sitio en producción**: https://api-comex-docs.eurus.pro (una vez desplegado y el DNS configurado).
- **Idiomas**: español (default) e inglés.
- **Fuente OpenAPI**: [`openapi/comex.yaml`](./openapi/comex.yaml).

---

## Estructura del proyecto

```
.
├── docs/                           # Contenido en español (default locale)
│   ├── intro.md
│   ├── quickstart.md
│   ├── authentication.md
│   ├── conventions.md              # Incluye formato de RUT, idAgencia, etc.
│   ├── webhooks.md
│   ├── errors.md
│   ├── changelog.md
│   ├── importaciones/index.md      # Módulo Importaciones (landing placeholder)
│   ├── exportaciones/index.md      # Módulo Exportaciones (landing placeholder)
│   ├── documentacion/index.md      # Módulo Documentación (landing + uso)
│   └── reference/                  # Generado automáticamente desde openapi/comex.yaml
├── i18n/en/                        # Traducciones al inglés (mismo árbol)
├── openapi/
│   └── comex.yaml                  # Spec OpenAPI 3.1 — base URL api-comex.eurus.pro
├── src/
│   ├── css/custom.css              # Variables de tema (placeholders de branding)
│   └── pages/index.tsx             # Landing
├── static/
│   ├── CNAME                       # api-comex-docs.eurus.pro
│   └── img/                        # Logo y favicon (placeholders)
├── docusaurus.config.ts
├── sidebars.ts
├── redocly.yaml                    # Reglas de validación del spec OpenAPI
└── .github/workflows/
    ├── ci.yml                      # Validación en PRs
    └── deploy.yml                  # Build + deploy a Pages en merge a main
```

---

## Desarrollo local

### Requisitos

- Node.js **≥ 20.19 y < 21** (línea 20 LTS) o **≥ 22.12** — el CI usa Node 22.
  Es el rango que declara `@redocly/cli`: excluye Node 21 completo y 22.0–22.11.
- npm (incluido con Node)

### Instalación

```bash
npm install
```

### Generar la referencia de la API

La referencia de endpoints se genera desde `openapi/comex.yaml`. `prestart` y `prebuild` la regeneran solos, así que en el flujo normal no hay que correr nada. Para hacerlo a mano:

```bash
npm run clean-api-docs:comex
npm run gen-api-docs:comex
```

El `clean` **es obligatorio**: `gen-api-docs` no sobrescribe los archivos que ya existen y no avisa. Sin limpiar antes, un cambio en la config del plugin o en la spec no se refleja, y quedás mirando la referencia vieja. Por eso `prestart` y `prebuild` encadenan los dos comandos.

`clean-api-docs` borra también `docs/reference/sidebar.ts`, que está trackeado en git y que `sidebars.ts` importa. El plugin no lo recrea, así que `clean-api-docs:comex` encadena `scripts/restore-sidebar-stub.js` para reponerlo. Si alguna vez ves este error, es que el stub falta — restauralo con `git checkout -- docs/reference/sidebar.ts`:

```
[ERROR] Sidebars file at "sidebars.ts" failed to be loaded.
[ERROR] Unable to build website for locale es.
```

### Probar la API desde el portal

El panel **"Try it"** de cada endpoint —donde se completan `idAgencia` y `key` y se ejecuta el GET— está **deshabilitado por defecto**, y no es un descuido: ejecuta el request desde el navegador, y `api-comex.eurus.pro` no devuelve ningún header `Access-Control-*`. El navegador descarta la respuesta aunque la API conteste 200, así que el panel no puede mostrar nada. Un botón que siempre falla le dice al integrador que la API está rota cuando el problema es la consola.

Para habilitarlo **en local**, el repo trae un proxy de desarrollo sin dependencias:

```bash
# Terminal 1
npm run dev:proxy

# Terminal 2 — bash/zsh
OPENAPI_PROXY=http://127.0.0.1:8788 npm run start

# Terminal 2 — PowerShell
$env:OPENAPI_PROXY = "http://127.0.0.1:8788"; npm run start
```

Con `OPENAPI_PROXY` definida, el plugin escribe `proxy` en el frontmatter en vez de `hide_send_button`, y el panel sale habilitado enrutando por ahí.

El proxy escucha **solo en 127.0.0.1** y solo reenvía a `api-comex.eurus.pro` (ampliable con `DEV_PROXY_ALLOW=host1,host2`); sin esa lista blanca sería un proxy abierto en tu máquina. Las credenciales se enmascaran en los logs.

**No uses un proxy CORS público** para esto: mandarías tu API key de producción a un servidor ajeno.

> **Esto no habilita el panel en el sitio publicado.** El proxy corre en tu máquina; el navegador de quien abre GitHub Pages no puede alcanzarlo. Para que funcione en público hace falta un proxy con URL pública que además inyecte la API key del lado servidor, en vez de pedírsela al visitante. Está pendiente de diseño.

Mientras tanto, `curl` no pasa por CORS y sirve para verificar comportamiento:

```bash
curl -s "https://api-comex.eurus.pro/$AG/v1/master/file-types?key=$KEY" | jq
```

### Validar antes de commitear

Los mismos comandos que corre el CI:

```bash
npm run lint         # Valida openapi/comex.yaml con Redocly
npm run type-check   # tsc
npm run build        # Build de ambos locales; falla ante links rotos
```

`onBrokenLinks` está en `throw`: un link interno roto rompe el build en lugar de publicarse como página con referencias muertas.

### Iniciar el servidor de desarrollo

```bash
# Español (default)
npm run start

# Inglés
npm run start -- --locale en
```

El sitio queda disponible en http://localhost:3000.

> **Nota**: Docusaurus solo puede servir un idioma a la vez en dev. Para probar el selector de idioma, usa `npm run build && npm run serve`.

### Build de producción

```bash
npm run build
npm run serve
```

Genera el sitio estático en `./build/` con ambos idiomas.

---

## Editar contenido

### Docs en español

Edita los archivos en [`docs/`](./docs). Docusaurus recarga en caliente durante `npm run start`.

### Docs en inglés

Edita los archivos correspondientes en [`i18n/en/docusaurus-plugin-content-docs/current/`](./i18n/en/docusaurus-plugin-content-docs/current). Los nombres de archivo deben coincidir con los de `docs/`.

### Añadir / modificar endpoints

1. Edita [`openapi/comex.yaml`](./openapi/comex.yaml).
2. Regenera la referencia:
   ```bash
   npm run clean-api-docs:comex && npm run gen-api-docs:comex
   ```
3. Verifica los MDX generados en `docs/reference/`.
4. Recuerda actualizar el sidebar si añades nuevos tags.

### Traducir strings del tema (navbar, footer, 404, etc.)

Edita [`i18n/en/docusaurus-theme-classic/navbar.json`](./i18n/en/docusaurus-theme-classic/navbar.json), [`footer.json`](./i18n/en/docusaurus-theme-classic/footer.json) y [`i18n/en/code.json`](./i18n/en/code.json).

Para regenerar los archivos base de traducción tras añadir strings nuevos con `<Translate>`:

```bash
npm run write-translations -- --locale en
```

---

## Deploy

El pipeline está separado en dos workflows:

| Workflow | Dispara | Qué hace |
|---|---|---|
| [`ci.yml`](./.github/workflows/ci.yml) | `pull_request` a `main` | `npm ci` → `lint` (spec) → `type-check` → `build` (es + en). No publica nada. |
| [`deploy.yml`](./.github/workflows/deploy.yml) | `push` a `main` | Los mismos gates → upload artifact → deploy a GitHub Pages. |

- **Check requerido**: exigir `CI / Lint del spec, type-check y build` en la protección de rama de `main`.
- **Dominio**: `static/CNAME` contiene `api-comex-docs.eurus.pro`.

> **Importante**: `deploy.yml` no lleva `paths-ignore`. Todo el contenido del portal son archivos `.md`, así que filtrar `'**.md'` impedía que un cambio de documentación llegara a publicarse.

### Primer deploy

1. Asegúrate de que la rama `main` tenga el scaffolding completo.
2. En **Settings → Pages** del repositorio:
   - **Source**: `GitHub Actions`.
3. Haz push a `main` y verifica que el workflow complete en verde.
4. El sitio queda disponible en `https://euruspro.github.io/api-comex-docs` (default) y, dado que el dominio `api-comex-docs.eurus.pro` ya está validado en la organización, en `https://api-comex-docs.eurus.pro` tras el primer deploy exitoso.
5. Habilita **Enforce HTTPS** en Settings → Pages.

---

## Branding

Los colores, logo y favicon actuales son **placeholders** y deben reemplazarse por los assets oficiales de EURUS PRO:

- **Paleta**: `src/css/custom.css` — ajusta las variables `--ifm-color-primary-*`.
- **Logo**: `static/img/logo.svg`.
- **Favicon**: `static/img/favicon.svg` (referenciado desde `docusaurus.config.ts`).

---

## Tareas pendientes conocidas

- [ ] Reemplazar el **logo SVG placeholder** (`static/img/logo.svg`, `logo-dark.svg`, `favicon.svg`) por el vector oficial del Brand Book cuando esté disponible como archivo.
- [ ] Habilitar los endpoints de los módulos **Importaciones** y **Exportaciones** cuando estén disponibles en la API.
- [ ] Ampliar la lista de `fileTypeName` soportados en el módulo de Documentación si la API habilita nuevos tipos.
- [ ] Traducción profesional al inglés de los contenidos.
- [ ] Documentar entorno sandbox cuando esté disponible.

---

## Licencia

Ver [`LICENSE`](./LICENSE).
