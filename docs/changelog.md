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

### Added — API Key en el header `x-api-key` (spec 3.3.0)

El API Key ahora puede enviarse en el header `x-api-key`, además del parámetro de query `?key=` de siempre. Basta con una de las dos ubicaciones. El header es la forma recomendada para integraciones nuevas: el key no queda en la URL, así que no se registra en logs de acceso ni en el historial del navegador.

Las integraciones existentes con `?key=` no necesitan cambiar. Si un request trae el key en las dos ubicaciones con valores distintos, se rechaza con `403 API_KEY_INVALID`. Ver [Autenticación](./authentication.md).

### Added — `GET /dispatch/{numeroDespacho}` (spec 3.2.0)

Devuelve los datos de un despacho: aduana, nave, consignante, valores CIF y FOB, y sus fechas. Es el mismo objeto que traen en `dispatch` los archivos y los desembolsos, ahora disponible sin consultar ninguno de los dos.

Mismas condiciones de acceso que el resto de los recursos del despacho: `rut` obligatorio, y el despacho tiene que ser de esa cuenta; si no, `404 DISPATCH_NOT_FOUND`. Ver [Seguimiento](./seguimiento/index.md#estado-y-datos-del-despacho).

### Changed — `recordType` en `GET /dispatch/status` (spec 3.1.0)

El filtro acepta los dos vocabularios y rechaza lo que no entiende:

| Valor | Antes | Ahora |
|---|---|---|
| `din`, `dus` | Filtra | Filtra (sin cambio) |
| `impo`, `expo` | `200` con lista vacía | Filtra como `din` / `dus` |
| `DIN`, `Expo` | `200` con lista vacía | Filtra: no distingue mayúsculas |
| `smda` u otro valor | `200` con lista vacía | **`400 RECORD_TYPE_INVALID`** |

**Qué hacer:** si tu integración enviaba `smda` o un valor no reconocido, recibía una lista vacía que no correspondía a ningún dato. Ahora recibe un `400`: corrige el valor u omite el parámetro.

`smda` no es un tipo de despacho: una SMDA (Solicitud de Modificación al Despacho Aduanero) siempre está vinculada a un despacho, pero es otro documento.

### Deprecated — Las rutas anteriores de despacho se retiran el 01-03-2027

`GET /dispatch/files/{numeroDespacho}`, `GET /dispatch/files` y `GET /dispatch/status/{numeroDespacho}` **dejan de estar disponibles el 1 de marzo de 2027, a las 00:00 (hora de Chile)**. Desde esa fecha responden `404`. Hasta entonces funcionan igual que hoy.

| Se retira | Usar en su lugar |
|---|---|
| `GET /dispatch/files/{numeroDespacho}` | `GET /dispatch/{numeroDespacho}/files` |
| `GET /dispatch/files` | `GET /files` |
| `GET /dispatch/status/{numeroDespacho}` | `GET /dispatch/{numeroDespacho}/status` |

`GET /dispatch/status` (el listado) **no** se retira.

La migración es un cambio de ruta: los parámetros, las respuestas y los errores son los mismos. Mientras tanto, cada respuesta de una ruta que se retira lo anuncia en sus encabezados, también los errores del propio endpoint (`400`, `404`, `500`). Un `403` de autenticación no los lleva: se responde antes de llegar a la ruta.

```http
Deprecation: @1790564400
Sunset: Mon, 01 Mar 2027 03:00:00 GMT
Link: </z_cl_demo/v1/dispatch/123457/files>; rel="successor-version"
```

- `Sunset` ([RFC 8594](https://www.rfc-editor.org/rfc/rfc8594)) es la fecha de retiro, en GMT: las 03:00 GMT son las 00:00 en Chile.
- `Link` con `rel="successor-version"` apunta a la ruta que la reemplaza.
- `Deprecation` ([RFC 9745](https://www.rfc-editor.org/rfc/rfc9745)) es la fecha desde la que la ruta está deprecada.

Para encontrar llamadas pendientes de migrar, registra en tu cliente las respuestas que traigan `Sunset`.

### Fixed — El `500` ya no expone detalle de la capa de datos (spec 3.0.1)

En `GET /dispatch/{numeroDespacho}/files`, `GET /files`, `GET /dispatch/{numeroDespacho}/status` y `GET /dispatch/status`, el `500` devolvía como `code` y `message` los de la capa de datos: un `code` numérico —que no cumplía el `code: string` del contrato— y, ante un índice faltante, un mensaje con una URL interna. Ahora es siempre `INTERNAL_ERROR` con un mensaje genérico, igual que en `/dispatch/{numeroDespacho}/desembolsos` y `/master/file-types`. El detalle queda en los logs del servicio, y el `requestId` es lo que permite cruzarlo al reportar.

Si tu integración ramificaba por el `code` de un `500`, trata cualquier `500` distinto de `TENANT_UNRESOLVED` como `INTERNAL_ERROR`: reintentar con back-off.

### Changed — Rutas de despacho y de archivos (spec 3.0.0)

**Las rutas anteriores siguen funcionando hasta el 01-03-2027**, fecha en que se retiran: ver *Deprecated* más arriba. El spec ya no las declara.

| Antes | Ahora |
|---|---|
| `GET /dispatch/files/{numeroDespacho}` | `GET /dispatch/{numeroDespacho}/files` |
| `GET /dispatch/status/{numeroDespacho}` | `GET /dispatch/{numeroDespacho}/status` |
| `GET /dispatch/files` | `GET /files` |
| `GET /dispatch/status` | sin cambio |

Los parámetros, las respuestas y los errores no cambian: es el mismo endpoint en otra ruta.

**Por qué.** Los recursos de un despacho pasan a colgar del despacho —`/dispatch/{numeroDespacho}/<recurso>`, igual que el nuevo `/desembolsos`—. Mezclar esa forma con la anterior hacía que una misma URL pudiera leerse de dos maneras. `/files` sale de `/dispatch` porque devuelve los archivos del cliente, que cruzan todos sus despachos.

La versión mayor responde al spec, no al servicio: un cliente generado desde la 3.0.0 no trae los métodos de las rutas anteriores.

### Added — `GET /dispatch/{numeroDespacho}/desembolsos`

Nuevo endpoint que devuelve **todos los desembolsos** de un despacho: los gastos que la agencia pagó por cuenta del cliente, con su estado, montos y documentos de respaldo. Nuevo módulo [Desembolsos](./desembolsos/index.md).

- Mismo acceso que `GET /dispatch/{numeroDespacho}/files`: `rut` obligatorio y despacho de esa cuenta. Uno de otro cliente responde `404`, igual que uno inexistente.
- Responde `{ date, total, data }`, sin paginación. `data` viene en orden cronológico por `fechaDesembolso`.
- Cada elemento trae el despacho asociado en `dispatch`, con estados de aforo y DIN, fechas del ciclo aduanero y valores CIF, FOB, flete y seguro.
- **Criterio propio de presencia**: los opcionales se omiten, los obligatorios de texto vienen como `""`, y las fechas y montos obligatorios como `null`, nunca `0`.
- El `500` es siempre `INTERNAL_ERROR`: el detalle de la capa de datos no se expone.

### Changed — `dispatch` en los endpoints de archivos

En los dos endpoints de archivos, `dispatch` pasa de `{ id, referencia }` a los datos completos del despacho: el mismo contrato que usa [Desembolsos](./desembolsos/index.md), más el `id`.

- **Es aditivo**: `id` y `referencia` siguen ahí.
- **Ya no puede venir vacío.** `dispatch` trae siempre todas sus claves, con `""` en los textos y `null` en fechas y montos. Es la única parte del archivo a la que no se aplica la eliminación de claves vacías. Si tu código trataba `dispatch: {}` como "sin despacho", ahora tiene que mirar `dispatch.id`.
- **`GET /files` ahora emite `dispatch.referencia`.** Antes no leía el despacho y la propiedad no aparecía nunca. Cada archivo trae su propio despacho, porque una página puede mezclar varios.

### Added — `GET /master/file-types`

Nuevo endpoint que devuelve los **tipos documentales activos** de la agencia: los valores que acepta el parámetro `fileTypeName` de `GET /dispatch/files`.

- Parámetro opcional `recordType`: `impo` (importación), `expo` (exportación) u omitido (ambos). No distingue mayúsculas; cualquier otro valor da `400 RECORD_TYPE_INVALID`.
- No requiere `rut`: el maestro es de la agencia, no de un cliente final.
- No pagina: devuelve el catálogo completo, sin `nextToken`.
- **No elimina las claves sin valor**, a diferencia de los endpoints de documentos: `name`, `tipoOperacion` y `responsableDoc` llegan en `null` cuando no están cargados, así que la forma de cada elemento es estable. Es el mismo criterio que `/dispatch/status`.
- Respuesta cacheable: es el único endpoint que emite `Cache-Control` (`private, max-age=60`). Un tipo documental recién habilitado puede tardar hasta un minuto en aparecer si tu cliente HTTP respeta el header.
- Los tamaños documentados de cada campo (`name` 64, `tipoOperacion` 3, `responsableDoc` 32, `id` 120) son **sugeridos**: sirven para dimensionar tus columnas, y la API no recorta el valor si lo excede.

Con esto, la tabla de `fileTypeName` de la guía de [Documentación](./documentacion/index.md) pasa a ser una referencia: la lista viva se consulta por API.

### Changed — Autorización por cuenta y nuevos endpoints de seguimiento

**Cambio de comportamiento en producción.** `rut` pasa de ser un parámetro declarado a un control efectivo, y el portal documenta por primera vez `/dispatch/status`.

#### `rut` ahora acota lo que devuelve la API

| Endpoint | Antes | Ahora |
|---|---|---|
| `GET /dispatch/files/{n}` | `rut` declarado obligatorio, **no se validaba** | Exigido; el despacho debe ser de esa cuenta |
| `GET /dispatch/status/{n}` | no pedía `rut` | Exigido; el despacho debe ser de esa cuenta |
| `GET /dispatch/status` | no pedía `rut`, devolvía todos | Exigido; filtra por cuenta |

Un despacho que no existe y uno que existe pero es de otro cliente devuelven la **misma** respuesta `404 DISPATCH_NOT_FOUND`. Es deliberado: si difirieran, probando números correlativos se podría deducir qué despachos existen en la agencia sin acceder a ninguno.

#### Documentados por primera vez: `/dispatch/status`

Dos endpoints que ya existían y el portal no describía: el detalle de un despacho y el listado de los de tu cuenta, con filtros por `recordType` e `isCompleted`, ordenamiento y `limit`.

Su contrato es **distinto** al de documentos en dos puntos que conviene no confundir:

- **Todas las claves están siempre presentes**; las vacías se emiten como `null` en vez de desaparecer.
- **No hay paginación por cursor.** Se acota con `limit` (máximo 200), y `total` es la cantidad devuelta, no la existente.

#### `nextToken` inválido pasa de silencio a `400`

Un `nextToken` que no corresponde a un documento existente ahora responde `400 NEXT_TOKEN_INVALID`. Antes se ignoraba y se devolvía la primera página, lo que hacía que un recorrido largo **reiniciara y volviera a procesar lo ya procesado**, duplicando datos sin ninguna señal.

#### `TENANT_UNRESOLVED`: nuevo código, y ya no es un `400`

Cuando la configuración de la agencia no se puede resolver, la respuesta pasa de `400 PROJECT_ID_UNDEFINED` a **`500 TENANT_UNRESOLVED`**. Un `4xx` atribuía al integrador un fallo que es de configuración nuestra, y hacía que ni su monitoreo ni el nuestro lo trataran como incidente. Reintentar no lo resuelve: hay que reportar el `requestId`.

#### Fechas y referencias en la respuesta

Las marcas de tiempo se emiten siempre como ISO 8601 con zona, y las referencias a otros documentos como su identificador, nunca como una ruta interna. En `/dispatch/status` las fechas salían crudas (`{"_seconds":…,"_nanoseconds":…}`); era un defecto.

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

Se retiran las cifras publicadas (60 req/min, 10 000 req/día) y los headers `X-RateLimit-*`: **la pasarela no declara ninguna cuota** para estos endpoints y la API no emite `429`. Cuando se definan cuotas se anunciarán acá antes de aplicarse.

#### Fechas y RUT

- `startDate` y `endDate` se interpretan en **`America/Santiago`**, no en UTC, y aceptan `YYYY-MM-DD HH:mm` además de `YYYY-MM-DD`. Sin hora, el rango cubre el día completo (`00:00:00.000` a `23:59:59.999`).
- `rut` ya no exige la forma canónica: se aceptan `999999999`, `99999999-9`, `99.999.999-9` y la `K` como dígito verificador. Se documenta qué se rechaza y por qué un RUT bien formado que no es cliente da `404`, no `400`.

#### Otros

- `idAgencia` deja de describirse como numérico: es una cadena opaca.
- Los ejemplos usan el tenant ficticio (`z_cl_demo`, despacho `123457`, RUT `999999999`) en vez de valores con apariencia de reales.
- El spec declara explícitamente que describe el **comportamiento del backend**, no la configuración de la pasarela.

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
- Aplicación del branding oficial de EURUS PRO®.
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
- Autenticación documentada vía **API Key en query parameter** (`?key=<API_KEY>`), consistente con la pasarela de API.
- Documentación del **formato de RUT** exigido por la API (solo dígitos, K → 1).
- Ejemplos de código en **cURL, Node.js y Python** para cada llamada, incluyendo helpers de normalización de RUT.
- Workflow de GitHub Actions para **deploy automático a GitHub Pages** con dominio personalizado `api-comex-docs.eurus.pro`.
- **Branding EURUS PRO®** aplicado: paleta corporativa (`#004ea3`, `#00bee3`, `#001a5d`, `#001833`, `#f2f3f5`) en light/dark mode, logo del repositorio como placeholder SVG basado en el Brand Book 2024, favicon con gradiente azul corporativo.
- Valores reales de **`fileTypeName`** documentados en el OpenAPI y en la página del módulo Documentación:
  - `FACTURA AGENCIA`
  - `FACTURA TERCEROS`
  - `NOTA DE COBRO`
  - `CERTIFICADO DE ORIGEN`
  - `CONOCIMIENTO DE EMBARQUE (B/L)`
- Advertencia explícita sobre **URL encoding** de `fileTypeName` (los valores contienen espacios, paréntesis y barras), con tabla de conversión y ejemplo con `cURL --data-urlencode`.
