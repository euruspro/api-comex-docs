# api-comex-docs

Documentación pública de la **API Comex de EURUS PRO** — centro de documentación técnica dirigido a integradores que consumen la API REST de comercio exterior de EURUS PRO.

Construido con [Docusaurus 3](https://docusaurus.io/) + [`docusaurus-plugin-openapi-docs`](https://github.com/PaloAltoNetworks/docusaurus-openapi-docs) para la referencia interactiva.

- **Sitio en producción**: https://docs.euruspro.com (una vez desplegado y el DNS configurado).
- **Idiomas**: español (default) e inglés.
- **Fuente OpenAPI**: [`openapi/comex.yaml`](./openapi/comex.yaml).

---

## Estructura del proyecto

```
.
├── docs/                 # Contenido en español (default locale)
│   ├── intro.md
│   ├── quickstart.md
│   ├── authentication.md
│   ├── conventions.md
│   ├── webhooks.md
│   ├── errors.md
│   ├── changelog.md
│   └── reference/        # Generado automáticamente desde openapi/comex.yaml
├── i18n/en/              # Traducciones al inglés
├── openapi/
│   └── comex.yaml        # Spec OpenAPI 3.1 de la API Comex
├── src/
│   ├── css/custom.css    # Variables de tema (placeholders de branding)
│   └── pages/index.tsx   # Landing
├── static/
│   ├── CNAME             # docs.euruspro.com
│   └── img/              # Logo y favicon (placeholders)
├── docusaurus.config.ts
├── sidebars.ts
└── .github/workflows/deploy.yml
```

---

## Desarrollo local

### Requisitos

- Node.js ≥ 18
- npm (incluido con Node)

### Instalación

```bash
npm install
```

### Generar la referencia de la API

La referencia de endpoints se genera desde `openapi/comex.yaml`. Cada vez que modifiques la spec, regenera:

```bash
npm run clean-api-docs:comex
npm run gen-api-docs:comex
```

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

El deploy a GitHub Pages es automático vía [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml):

- **Dispara** en `push` a `main` y en PRs (build-only en PRs).
- **Pasos**: install → `gen-api-docs:comex` → `build` → upload artifact → deploy a GitHub Pages.
- **Dominio**: `static/CNAME` contiene `docs.euruspro.com`.

### Primer deploy

1. Asegúrate de que la rama `main` tenga el scaffolding completo.
2. En **Settings → Pages** del repositorio:
   - **Source**: `GitHub Actions`.
3. Haz push a `main` y verifica que el workflow complete en verde.
4. El sitio queda disponible en `https://euruspro.github.io/api-comex-docs` (default) y, una vez configurado el DNS (`CNAME docs → euruspro.github.io`), en `https://docs.euruspro.com`.
5. Habilita **Enforce HTTPS** en Settings → Pages.

---

## Branding

Los colores, logo y favicon actuales son **placeholders** y deben reemplazarse por los assets oficiales de EURUS PRO:

- **Paleta**: `src/css/custom.css` — ajusta las variables `--ifm-color-primary-*`.
- **Logo**: `static/img/logo.svg`.
- **Favicon**: `static/img/favicon.svg` (referenciado desde `docusaurus.config.ts`).

---

## Tareas pendientes conocidas

- [ ] Reemplazar los 2 endpoints placeholder en `openapi/comex.yaml` por la spec real cuando esté disponible.
- [ ] Aplicar branding oficial (logo, colores, tipografía).
- [ ] Confirmar la base URL de producción (`https://api.euruspro.com/comex/v1` es provisional).
- [ ] Traducción profesional al inglés de los contenidos.
- [ ] Documentar entorno sandbox cuando esté disponible.

---

## Licencia

Ver [`LICENSE`](./LICENSE).
