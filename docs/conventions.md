---
id: conventions
title: Convenciones
sidebar_position: 4
slug: /conventions
description: Formatos, versionado, identificadores, paginación, rate limits y códigos HTTP de la API Comex.
---

# Convenciones

Esta página describe los estándares y convenciones que la API Comex de EURUS PRO® aplica de forma transversal a todos los endpoints. Conocerlas te ahorrará sorpresas al integrar.

## Base URL y versionado

La URL base de la API incluye **dos elementos variables** antes del path del recurso:

```
https://api-comex.eurus.pro/{idAgencia}/v1/...
```

| Segmento | Descripción |
|---|---|
| `{idAgencia}` | Identificador de tu agencia EURUS PRO®. Es una cadena opaca, no un número: trátala como un string literal. Se asigna al provisionar el acceso. |
| `v1` | Versión mayor de la API. |

- **Cambios breaking** se publican en una nueva versión mayor (`/v2`).
- **Cambios no-breaking** (nuevos campos opcionales, nuevos endpoints) se añaden a la versión actual.
- Las versiones anteriores se mantienen activas durante un período de migración que se anunciará en el [Changelog](./changelog.md).

:::info Política de deprecación
Cuando un endpoint o campo se marque como deprecated, se anunciará en el Changelog con al menos 90 días de anticipación antes de su retirada.
:::

## Identificadores comunes

Casi todas las llamadas a la API Comex involucran estos tres identificadores:

### `idAgencia` (path)

Segmento que identifica tu agencia EURUS PRO®. Forma parte del path, antes de `/v1`.

```
https://api-comex.eurus.pro/z_cl_demo/v1/...
                           ^^^^^^^^^
                           idAgencia
```

No asumas que es numérico ni que tiene un largo fijo: es una cadena opaca. Si tu API Key no está autorizada para el `idAgencia` de la ruta, la respuesta es `403 PROJECT_ID_UNAUTHORIZED`.

### `key` (query, obligatorio)

API Key que autentica la llamada. Ver [Autenticación](./authentication.md).

### `rut` (query, obligatorio en la mayoría de endpoints)

RUT del cliente final del que estás consultando datos.

#### Formato de RUT

El parámetro `rut` es el **cuerpo más el dígito verificador**. La API acepta varias formas de presentación y las normaliza internamente a la misma consulta:

| Lo que envías | Se consulta como |
|---|---|
| `999999999` | `999999999` |
| `99999999-9` | `999999999` |
| `99.999.999-9` | `999999999` |
| `99999999K` / `99999999-k` | `999999991` |

La forma canónica —solo dígitos, con la `K` convertida a `1`— es la que recomendamos: es la que la API usa internamente y la que menos ambigüedad deja. Los helpers de abajo la producen.

**Qué se rechaza** con `400 RUT_NUMBER_INVALID`, porque no es un RUT:

| Entrada | Por qué se rechaza |
|---|---|
| `1e2` | Notación científica. |
| `0x7B` | Hexadecimal. |
| `123.0` | Decimal; los puntos solo valen como separadores de miles. |
| `1234567.890` | Puntos que no son la agrupación de miles del cuerpo. |
| `076501137` | Cero inicial: cambiaría el valor numérico consultado. |
| `-999999999` | Signo. |

El **largo no se valida**. Un RUT bien formado que no corresponde a un cliente activo devuelve `404 ACCOUNT_NOT_FOUND`, no un `400`: la distinción importa para saber si el error está en tu request o en los datos.

#### Helper en JavaScript

```javascript
function normalizarRut(rut) {
  // Elimina puntos, guion y espacios
  const limpio = rut.replace(/[.\-\s]/g, "").toUpperCase();
  // Reemplaza K final por 1
  return limpio.endsWith("K") ? limpio.slice(0, -1) + "1" : limpio;
}

normalizarRut("99.999.999-K"); // "999999991"
normalizarRut("99.999.999-9"); // "999999999"
```

#### Helper en Python

```python
def normalizar_rut(rut: str) -> str:
    limpio = rut.replace(".", "").replace("-", "").replace(" ", "").upper()
    return limpio[:-1] + "1" if limpio.endswith("K") else limpio

normalizar_rut("99.999.999-K")  # "999999991"
normalizar_rut("99.999.999-9")  # "999999999"
```

## Formato de request y response

- **Content type**: `application/json`.
- **Charset**: UTF-8.
- **Nombres de campos**: `camelCase` en responses.
- **Identificadores**: `numeroDespacho` e `id` son strings, incluso cuando su contenido parece numérico. No los parsees a entero.
- **Fechas en parámetros** (`startDate`, `endDate`): `YYYY-MM-DD` o `YYYY-MM-DD HH:mm`, interpretadas en **`America/Santiago`**. Ver [Zona horaria](#zona-horaria-de-los-rangos-de-fecha).
- **Fechas emitidas por la API**: ISO 8601 en UTC (`2026-01-31T22:04:31.000Z`). La excepción son los valores dentro de `infoDoc`, que vienen de extracción con IA **sin normalizar** y cuyo formato no está garantizado.

### Convenciones de valores

La API **no impone longitudes de campo**. Lo que sigue es guía para tu modelado, no una garantía del contrato:

| Tipo | Convención | Ejemplo |
|---|---|---|
| Timestamps emitidos por la API | ISO 8601 con zona | `2026-01-31T22:04:31.000Z` |
| Fechas en parámetros | `YYYY-MM-DD` o `YYYY-MM-DD HH:mm` | `2026-01-31` |
| Números enteros | Sin decimales | `15000` |
| Números con decimales | Hasta 4 decimales (ej. tipo de cambio) | `850.2534` |
| Strings | Sin límite declarado | — |

## Tipos internos en la respuesta

El almacenamiento interno de la API maneja dos tipos que **no son JSON**. Ambos se convierten antes de responder:

| Tipo interno | Se emite como | Ejemplo |
|---|---|---|
| Marca de tiempo | string ISO 8601 con zona | `"2026-01-31T22:04:31.000Z"` |
| Referencia a otro documento | **el identificador**, no una ruta interna | `"acc-1"` |

No vas a ver marcas de tiempo en formato interno (`{"_seconds":…,"_nanoseconds":…}`) ni rutas internas de almacenamiento. Si alguna vez lo ves, es un defecto: repórtalo con el `requestId`.

## Presencia de campos: lo que más sorprende al integrar

Esta es la convención que conviene leer antes de escribir la primera línea de código.

:::info Aplica a los documentos, no a los estados
Lo que sigue rige para `GET /dispatch/files`. En `GET /dispatch/status` es al revés: **todas las claves están siempre presentes** y las que no tienen valor se emiten como `null`. Son dos contratos distintos; no asumas el de un endpoint al leer el otro.
:::

Antes de serializar la respuesta, la API **elimina recursivamente toda propiedad cuyo valor sea `null`, `undefined` o `""`** (string vacío).

| Valor | Qué pasa con la clave |
|---|---|
| `null`, `undefined`, `""` | **se elimina del JSON** |
| `false`, `0` | se conserva |
| Objeto que quedó sin propiedades | se conserva, como `{}` |
| Array | se limpia elemento por elemento |

La consecuencia:

:::warning La presencia de una clave no está garantizada
Un campo presente en un elemento **puede faltar en el siguiente de la misma respuesta**, porque su valor era vacío — no porque no aplique. Trata todo campo opcional como potencialmente ausente.
:::

### Lo único garantizado

En `GET /dispatch/files` (ambas variantes), cada elemento de `data` trae siempre estos cuatro:

| Campo | Por qué siempre está |
|---|---|
| `id` | Se asigna desde el ID del documento. |
| `isActive` | Cae a `false`, y `false` no se elimina. |
| `dispatch` | Es un objeto contenedor; los objetos vacíos se conservan. |
| `infoDoc` | Ídem: sobrevive como `{}`. |

Un documento sin ningún campo poblado devuelve exactamente esto:

```json
{ "id": "FILE-001", "isActive": false, "dispatch": {}, "infoDoc": {} }
```

### La trampa del objeto vacío

`dispatch` e `infoDoc` **siempre existen, pero pueden venir vacíos**. Y en JavaScript `{}` es *truthy*, así que esto no funciona:

```javascript
// ❌ Se ejecuta incluso con infoDoc = {}
if (item.infoDoc) {
  console.log(item.infoDoc.document.number); // TypeError
}
```

Verifica **contenido**, no presencia:

```javascript
// ✅
if (item.infoDoc?.document?.number) {
  console.log(item.infoDoc.document.number);
}
```

En Python el problema no aparece —un dict vacío es falsy— pero el acceso anidado sigue necesitando cuidado:

```python
numero = (item.get("infoDoc") or {}).get("document", {}).get("number")
if numero:
    ...
```

## Zona horaria de los rangos de fecha

Los parámetros `startDate` y `endDate` se interpretan en **`America/Santiago`**, no en UTC.

Sin hora explícita, el rango cubre el día completo en esa zona:

| Parámetro | Se ancla a |
|---|---|
| `startDate=2026-01-15` | `2026-01-15 00:00:00.000` en Chile |
| `endDate=2026-01-15` | `2026-01-15 23:59:59.999` en Chile |

La comparación es **inclusiva en ambos extremos**. Chile tiene horario de verano, así que el desplazamiento respecto de UTC cambia según la fecha del rango (`-03:00` o `-04:00`): si conviertes a UTC en tu lado, usa una librería con base de datos de zonas, no un offset fijo.

Una fecha que no existe en el calendario (`2026-02-30`) se rechaza con `400`.

### Headers recomendados

| Header | Valor | Notas |
|---|---|---|
| `Accept` | `application/json` | Recomendado incluir explícitamente. |
| `Accept-Language` | `es` o `en` | Idioma preferido para mensajes de error legibles. |
| `User-Agent` | `MiApp/1.2.3 (+https://miapp.com)` | Recomendado — ayuda al soporte a identificar tu tráfico. |

## Paginación

La paginación es por **cursor**, con un límite **fijo de 100 elementos** por página. No hay parámetros `page`, `limit` ni `offset`, y **no existe un campo `total`**: la API no informa el total de resultados.

| Elemento | Dónde | Comportamiento |
|---|---|---|
| `nextToken` | En la respuesta | Presente **solo si la página trajo exactamente 100 elementos**. Ausente en la última página. |
| `?nextToken=` | En el request | El valor recibido en la respuesta anterior. Se omite para la primera página. |

### Cómo cortar el bucle

**La condición de corte es la ausencia de `nextToken`.** No compares el contenido de dos páginas ni cuentes elementos.

```javascript
const documentos = [];
let nextToken;

do {
  const params = new URLSearchParams({ key, rut, fileTypeName, startDate, endDate });
  if (nextToken) params.set("nextToken", nextToken);

  const res = await fetch(`${BASE}/dispatch/files?${params}`);
  if (!res.ok) throw new Error(`${res.status} ${(await res.json()).code}`);

  const pagina = await res.json();
  documentos.push(...pagina.data);
  nextToken = pagina.nextToken;   // undefined en la última página
} while (nextToken);
```

Dos comportamientos que conviene tolerar explícitamente:

:::warning Una última página vacía es normal
Un total de **exactamente 100** resultados devuelve un `nextToken` cuya página siguiente viene con `data: []`. No es un error: es la forma en que termina el recorrido.
:::

:::warning Un `nextToken` inválido da `400`
Si el token no corresponde a un documento existente —por ejemplo, porque el documento se eliminó mientras recorrías las páginas— la respuesta es `400 NEXT_TOKEN_INVALID`.

Antes ese caso se ignoraba en silencio y se devolvía la primera página, lo que era peor de lo que parece: el recorrido **reiniciaba y volvía a procesar lo ya procesado**, duplicando datos sin ninguna señal. Un job de conciliación cargaba las mismas facturas dos veces.

Ante ese error, reinicia el recorrido desde el principio sin `nextToken`.
:::

:::note `/dispatch/status` no usa este mecanismo
El listado de estados se acota con `limit` (máximo 200) y no tiene cursor. Ahí `total` es la cantidad devuelta, no la existente: si viene igual a `limit`, probablemente haya más.
:::

## Rate limits

**Hoy no hay límites de tasa declarados** para estos endpoints, y la API **no emite `429`** ni headers `X-RateLimit-*`.

No lo leas como una invitación a consumir sin control: es una configuración que puede cambiar, y el comportamiento sin límites declarados no es una garantía del contrato. Cuando se definan cuotas se anunciarán en el [Changelog](./changelog.md) antes de aplicarse.

**Recomendaciones que sí aplican ahora**:

- **Back-off exponencial con jitter** ante `500`. Es el código que puede aparecer por un error transitorio de la capa de datos.
- **Paginar en serie, no en paralelo.** La paginación por cursor lo exige de todos modos: necesitas el `nextToken` de una página para pedir la siguiente.
- Para cargas históricas grandes, **acotar por rangos de fecha** en vez de recorrer todo de una vez.

## Códigos HTTP usados

| Código | Significado | Cuándo |
|---|---|---|
| **200** OK | Éxito. | GET exitoso. `data: []` también es `200`. |
| **400** Bad Request | Request mal formado. | Parámetro faltante, RUT que no es un RUT, fecha mal formada o rango invertido. |
| **403** Forbidden | API Key ausente, inválida o no autorizada. | Falta `?key=...`, la key fue revocada, o no está autorizada para el `idAgencia` de la ruta. |
| **404** Not Found | El recurso no existe en la agencia. | `numeroDespacho` inexistente, o RUT que no es cliente activo de esta API. |
| **500** Internal Server Error | Error del servidor. | Reintentar con back-off; si persiste, reportar el `requestId`. |

:::info La API responde 403, no 401
Incluso cuando la API Key **falta**, la respuesta es `403` con `code: API_KEY_INVALID`. Una versión anterior de esta documentación declaraba `401`: no existe. Tampoco se emiten `429` ni `503`.
:::

Ver [Errores](./errors.md) para el formato estándar del cuerpo de error y el catálogo de códigos aplicativos.
