---
id: changelog
title: Changelog
sidebar_position: 99
slug: /changelog
description: Historial de cambios de la API Comex y de esta documentación.
---

# Changelog

Todos los cambios notables en la API Comex y en su documentación se registran aquí. Este proyecto sigue [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) y [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added — `GET /master/file-types`

Nuevo endpoint que devuelve los **tipos documentales activos** de la agencia: los valores que acepta el parámetro `fileTypeName` de `GET /dispatch/files`.

- Parámetro opcional `recordType`: `impo` (importación), `expo` (exportación) u omitido (ambos). No distingue mayúsculas; cualquier otro valor da `400 RECORD_TYPE_INVALID`.
- No requiere `rut`: el maestro es de la agencia, no de un cliente final.
- No pagina: devuelve el catálogo completo, sin `nextToken`.
- **A diferencia del resto de la API, no elimina las claves sin valor**: `name`, `tipoOperacion` y `responsableDoc` llegan en `null` cuando no están cargados, así que la forma de cada elemento es estable.
- Los tamaños documentados de cada campo (`name` 64, `tipoOperacion` 3, `responsableDoc` 32, `id` 120) son **sugeridos**: sirven para dimensionar tus columnas, y la API no recorta el valor si lo excede.

Con esto, la tabla de `fileTypeName` de la guía de [Documentación](./documentacion/index.md) pasa a ser una referencia: la lista viva se consulta por API.

### Changed — El contrato publicado ahora refleja la API real

Esta versión corrige una divergencia amplia entre lo que el portal documentaba y lo que la API devuelve. **Si ya integraste contra la documentación anterior, revisa esta sección: varios campos que el spec declaraba no existen.**

#### Respuesta de `GET /dispatch/files` (ambas variantes)

| Campo documentado antes | Estado real |
|---|---|
| `fileName` | **No existe.** |
| `fileTypeName` (en la respuesta) | **No existe.** El tipo de documento viene en `name`. |
| `dispatchNumber` | **No existe.** El número viene en `numeroDespacho`. |
| `issuedAt` | **No existe.** La fecha de emisión, cuando la hay, está en `infoDoc.document.issueDate`, sin formato garantizado. |
| `total` (envelope) | **No existe.** La paginación es por cursor. |

Campos reales que el spec no declaraba: `id`, `isActive`, `dispatch`, `infoDoc`, y en el envelope `date`, `nextToken` y `unsignedCount`.

#### Presencia de campos

Se documenta por primera vez que la API **elimina del JSON toda propiedad cuyo valor sea `null`, `undefined` o `""`**. Solo `id`, `isActive`, `dispatch` e `infoDoc` están garantizados; el resto puede faltar en un elemento y estar en el siguiente de la misma respuesta. Incluye la advertencia sobre `{}` siendo *truthy*.

#### Paginación

Se retira la nota que decía que no había paginación. Es por **cursor**, con límite fijo de **100** por página: `nextToken` aparece solo si la página trajo exactamente 100 elementos. Se documentan dos comportamientos que hay que tolerar: la última página puede venir vacía, y un `nextToken` inválido **se ignora en silencio** devolviendo la primera página.

#### Errores

El catálogo anterior (`INVALID_ARGUMENT`, `UNAUTHENTICATED`, `RATE_LIMITED`, `BUSINESS_RULE_VIOLATION` y otros ocho) **no correspondía a ningún código emitido por la API**. Se reemplazó por el catálogo real: `API_KEY_INVALID`, `PROJECT_ID_UNAUTHORIZED`, `PROJECT_ID_UNDEFINED`, `DISPATCH_ID_INVALID`, `DISPATCH_NOT_FOUND`, `RUT_NUMBER_INVALID`, `START_DATE_REQUIRED`, `END_DATE_REQUIRED`, `START_DATE_INVALID`, `END_DATE_INVALID`, `DATE_RANGE_INVALID`, `FILE_TYPE_NAME_INVALID`, `ACCOUNT_NOT_FOUND` e `INTERNAL_ERROR`.

- El cuerpo de error es `{ status, code, message, requestId }`. **No existe `details`.**
- **La API responde `403`, no `401`**, incluso cuando la API Key falta.
- **No se emiten `408`, `409`, `422`, `429`, `502`, `503` ni `504`.**

#### Rate limits

Se retiran las cifras publicadas (60 req/min, 10 000 req/día) y los headers `X-RateLimit-*`: **el API Gateway no declara ninguna cuota** para estos endpoints y la API no emite `429`. Cuando se definan cuotas se anunciarán acá antes de aplicarse.

#### Fechas y RUT

- `startDate` y `endDate` se interpretan en **`America/Santiago`**, no en UTC, y aceptan `YYYY-MM-DD HH:mm` además de `YYYY-MM-DD`. Sin hora, el rango cubre el día completo (`00:00:00.000` a `23:59:59.999`).
- `rut` ya no exige la forma canónica: se aceptan `999999999`, `99999999-9`, `99.999.999-9` y la `K` como dígito verificador. Se documenta qué se rechaza y por qué un RUT bien formado que no es cliente da `404`, no `400`.

#### Otros

- `idAgencia` deja de describirse como numérico: es una cadena opaca.
- Los ejemplos usan el tenant ficticio (`z_cl_demo`, despacho `123457`, RUT `999999999`) en vez de valores con apariencia de reales.
- El spec declara explícitamente que describe el **comportamiento del backend**, no la configuración del API Gateway.

### Added

- **URL de descarga** (`url`) en cada documento: firmada, con **vigencia de 1 hora**. Puede faltar por dos motivos distintos —el documento no tiene archivo, o su URL no se pudo firmar— y el segundo caso se cuenta en `unsignedCount`.
- **`requestId`** garantizado en todos los cuerpos de error y en el header `X-Request-Id` de toda respuesta. Se documenta que un `X-Request-Id` entrante se respeta, con sus límites de largo y alfabeto.
- **CI** ([`ci.yml`](https://github.com/euruspro/api-comex-docs/blob/main/.github/workflows/ci.yml)): validación de todo PR contra `main` — lint del spec OpenAPI con Redocly, `type-check` y build de ambos locales.
- **Validación del spec** con Redocly (`redocly.yaml`), incluyendo verificación de que los ejemplos validen contra su propio schema.

### Fixed

- El workflow de deploy filtraba `'**.md'` en `paths-ignore`, por lo que **ningún cambio de documentación llegaba a publicarse**. Se eliminó el filtro y se separó CI de CD.
- `onBrokenLinks` y `onBrokenMarkdownLinks` pasaron de `warn` a `throw`: un link interno roto ahora detiene el build en lugar de publicarse.
- `DispatchFile.issuedAt` usaba `nullable: true`, sintaxis de OpenAPI 3.0 inválida en 3.1 (el spec declara `openapi: 3.1.0`). El campo se eliminó junto con el resto del schema ficticio.

### Por definir

- Endpoints del módulo de **Importaciones**.
- Endpoints del módulo de **Exportaciones**.
- Traducción profesional al inglés.
- Aplicación del branding oficial de EURUS PRO.
- Entorno sandbox con credenciales de prueba.
- Postman collection oficial.
- Cuotas de uso, si se definen.

---

## [0.1.0] — 2026-04-10

### Added — Publicación inicial del portal de documentación

- Scaffolding inicial del centro de documentación pública con [Docusaurus 3](https://docusaurus.io/) y el plugin [`docusaurus-plugin-openapi-docs`](https://github.com/PaloAltoNetworks/docusaurus-openapi-docs) para referencia interactiva.
- Soporte bilingüe **español (default)** e **inglés** mediante i18n.
- **3 módulos funcionales** estructurados en la navegación:
  - **Importaciones** (próximamente)
  - **Exportaciones** (próximamente)
  - **Documentación** (disponible)
- Sección **Primeros pasos**: Introducción, Quickstart, Autenticación.
- Sección **Guías técnicas**: Convenciones, Errores, Webhooks.
- **2 endpoints reales** documentados en el módulo de Documentación:
  - `GET /{idAgencia}/v1/dispatch/files/{numeroDespacho}` — documentos de un despacho (con filtro opcional por `fileTypeName`).
  - `GET /{idAgencia}/v1/dispatch/files` — documentos por tipo y rango de fechas.
- **Base URL de producción**: `https://api-comex.eurus.pro/{idAgencia}/v1`.
- Autenticación documentada vía **API Key en query parameter** (`?key=<API_KEY>`), consistente con Google Cloud API Gateway.
- Documentación del **formato de RUT** exigido por la API (solo dígitos, K → 1).
- Ejemplos de código en **cURL, Node.js y Python** para cada llamada, incluyendo helpers de normalización de RUT.
- Workflow de GitHub Actions para **deploy automático a GitHub Pages** con dominio personalizado `api-comex-docs.eurus.pro`.
- **Branding EURUS PRO** aplicado: paleta corporativa (`#004ea3`, `#00bee3`, `#001a5d`, `#001833`, `#f2f3f5`) en light/dark mode, logo del repositorio como placeholder SVG basado en el Brand Book 2024, favicon con gradiente azul corporativo.
- Valores reales de **`fileTypeName`** documentados en el OpenAPI y en la página del módulo Documentación:
  - `FACTURA AGENCIA`
  - `FACTURA TERCEROS`
  - `NOTA DE COBRO`
  - `CERTIFICADO DE ORIGEN`
  - `CONOCIMIENTO DE EMBARQUE (B/L)`
- Advertencia explícita sobre **URL encoding** de `fileTypeName` (los valores contienen espacios, paréntesis y barras), con tabla de conversión y ejemplo con `cURL --data-urlencode`.
