---
id: errors
title: Errores
sidebar_position: 6
slug: /errors
description: Formato estándar de errores y catálogo real de códigos de la API Comex.
---

# Errores

La API Comex usa un **formato único de error** para toda respuesta con código HTTP ≥ 400, así que un solo handler te sirve para todos los endpoints.

## Formato estándar

`Content-Type: application/json`, con esta estructura:

```json
{
  "status": 400,
  "code": "RUT_NUMBER_INVALID",
  "message": "The RUT parameter is required and must include the check digit.",
  "requestId": "6b3f5c8e-1234-4abc-9def-0123456789ab"
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `status` | integer | El código HTTP, repetido en el cuerpo para facilitar tu logging. |
| `code` | string | Código estable. **Ramifica sobre este campo**, no sobre `message`. |
| `message` | string | Descripción legible, **en inglés**. No está pensada para mostrarse al usuario final sin traducir. |
| `requestId` | string | Identificador único de la invocación. **Inclúyelo al reportar una incidencia.** |

Los cuatro campos están **siempre** presentes. No existe un campo `details`.

:::tip Usa `code`, no `message`
La redacción de `message` puede cambiar sin aviso —de hecho cambió en la última versión, para corregir mensajes que describían mal el error—. El `code` es el contrato.
:::

## `requestId` y el header `X-Request-Id`

Cada respuesta lleva el identificador de la invocación en el header `X-Request-Id`, y los errores lo repiten en el cuerpo. Es la vía para que soporte encuentre tu request en los logs.

**Puedes imponer el tuyo.** Si envías `X-Request-Id` en el request, la API lo respeta, de modo que una traza que atraviesa varios de tus servicios conserve el mismo identificador:

| Condición | Valor |
|---|---|
| Largo (medido después de recortar espacios) | hasta 128 caracteres |
| Alfabeto permitido | `A-Z`, `a-z`, `0-9` y `_ . : @ + ~ / = -` |

Cubre UUID, hexadecimal, `traceparent` de W3C e identificadores de Cloud Trace. Un valor que no cumpla **no produce un error**: la API genera su propio UUID y te lo devuelve en el header, así que siempre recibes un identificador utilizable.

## Catálogo de códigos

### Autenticación y agencia

| HTTP | `code` | Cuándo |
|---|---|---|
| **403** | `API_KEY_INVALID` | Falta `?key=`, o el valor no es utilizable. También cuando llega repetida con valores distintos. |
| **403** | `PROJECT_ID_UNAUTHORIZED` | La API Key no está autorizada para el `idAgencia` de la ruta. |
| **400** | `PROJECT_ID_UNDEFINED` | Falta el `idAgencia` en el path. |
| **500** | `TENANT_UNRESOLVED` | La configuración de tu agencia no se pudo resolver. **No es un error de tu request**: ver más abajo. |

:::info No existe el 401
Incluso cuando la API Key **falta**, la respuesta es `403`. Una versión anterior de esta documentación declaraba `401`.
:::

### Despachos: `/dispatch/files/{n}` y `/dispatch/status/{n}`

| HTTP | `code` | Cuándo |
|---|---|---|
| **400** | `DISPATCH_ID_INVALID` | `numeroDespacho` vacío. |
| **400** | `RUT_NUMBER_INVALID` | `rut` ausente, o su forma no es un RUT. |
| **404** | `ACCOUNT_NOT_FOUND` | El RUT no es cliente o no está activo. |
| **404** | `DISPATCH_NOT_FOUND` | El despacho no existe en tu agencia, **o no pertenece a la cuenta del `rut`**. |

:::warning Los dos casos del 404 son indistinguibles, a propósito
Un despacho inexistente y uno que existe pero es de otro cliente devuelven la **misma** respuesta. Si difirieran, probando números correlativos se podría deducir qué despachos existen en la agencia sin acceder a ninguno.
:::

### `GET /dispatch/files`

| HTTP | `code` | Cuándo |
|---|---|---|
| **400** | `RUT_NUMBER_INVALID` | `rut` ausente, o su forma no es un RUT. Ver [Convenciones → Formato de RUT](./conventions.md#formato-de-rut). |
| **400** | `START_DATE_REQUIRED` | Falta `startDate`. |
| **400** | `END_DATE_REQUIRED` | Falta `endDate`. |
| **400** | `START_DATE_INVALID` | `startDate` no tiene formato reconocido, o es una fecha que no existe. |
| **400** | `END_DATE_INVALID` | Ídem para `endDate`. |
| **400** | `DATE_RANGE_INVALID` | `startDate` es mayor que `endDate`. |
| **400** | `FILE_TYPE_NAME_INVALID` | Falta `fileTypeName`, que es obligatorio en este endpoint. |
| **400** | `NEXT_TOKEN_INVALID` | El `nextToken` no corresponde a un documento existente. Puede pasar si el documento ancla se eliminó mientras recorrías las páginas. |
| **404** | `ACCOUNT_NOT_FOUND` | El RUT está bien formado, pero no es cliente o no está activo para esta API. |

### `GET /master/file-types`

| HTTP | `code` | Cuándo |
|---|---|---|
| **400** | `RECORD_TYPE_INVALID` | `recordType` trae un valor distinto de `impo` o `expo`, o llega repetido con valores distintos. Omitirlo es válido: devuelve ambos. |
| **500** | `INTERNAL_ERROR` | Fallo de la operación. Acá **nunca** se propaga el código de la capa de datos: el detalle queda en los logs del servicio, y el `requestId` es lo que permite cruzarlo al reportar. |
| **500** | `TENANT_UNRESOLVED` | Lo emite la capa de autenticación, antes de llegar a esta operación, igual que en cualquier endpoint. Ver [Autenticación y agencia](#autenticación-y-agencia). |

:::note Este endpoint no emite 404
No recibe `rut` ni identificador de despacho: una agencia sin tipos documentales activos responde `200` con `data: []`.
:::

### Errores del servidor

| HTTP | `code` | Cuándo |
|---|---|---|
| **500** | `INTERNAL_ERROR` o un código de la capa de datos | Error no controlado. Reintentar con back-off. |
| **500** | `TENANT_UNRESOLVED` | La configuración de tu agencia no se pudo resolver. **Reintentar no ayuda**: tu API Key y tu `idAgencia` son válidos, el problema es de configuración del lado de EURUS PRO. Reportar el `requestId`. |

:::warning 400 y 404 significan cosas distintas
`400 RUT_NUMBER_INVALID` dice que **la forma** del RUT es inválida: el error está en tu request. `404 ACCOUNT_NOT_FOUND` dice que el RUT es válido pero **no corresponde a un cliente activo**: el error está en los datos. Distinguirlos te evita depurar en el lugar equivocado.
:::

## Ejemplos

### 403 — API Key ausente o inválida

```http
HTTP/1.1 403 Forbidden
Content-Type: application/json
X-Request-Id: b1e8a9c2-0000-4fff-a000-100000000001

{
  "status": 403,
  "code": "API_KEY_INVALID",
  "message": "API key is invalid or missing",
  "requestId": "b1e8a9c2-0000-4fff-a000-100000000001"
}
```

### 400 — RUT con forma inválida

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json
X-Request-Id: b1e8a9c2-0000-4fff-a000-100000000002

{
  "status": 400,
  "code": "RUT_NUMBER_INVALID",
  "message": "The RUT parameter is required and must include the check digit. Accepted forms: 765011379, 76501137-9, 76.501.137-9 and the K check digit (76501137K).",
  "requestId": "b1e8a9c2-0000-4fff-a000-100000000002"
}
```

### 400 — Rango de fechas invertido

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json
X-Request-Id: b1e8a9c2-0000-4fff-a000-100000000003

{
  "status": 400,
  "code": "DATE_RANGE_INVALID",
  "message": "startDate must not be greater than endDate.",
  "requestId": "b1e8a9c2-0000-4fff-a000-100000000003"
}
```

### 404 — El RUT no es cliente activo

```http
HTTP/1.1 404 Not Found
Content-Type: application/json
X-Request-Id: b1e8a9c2-0000-4fff-a000-100000000004

{
  "status": 404,
  "code": "ACCOUNT_NOT_FOUND",
  "message": "The provided RUT (Chilean tax ID) is not a client or is not active for the use of this API.",
  "requestId": "b1e8a9c2-0000-4fff-a000-100000000004"
}
```

## Estrategia de reintentos

| Código | ¿Reintentar? | Cómo |
|---|---|---|
| **400** | **No** | Es un error de tu request. Reintentar da el mismo resultado. |
| **403** | **No** | Revisa la API Key y el `idAgencia`. |
| **404** | **No** | El recurso no existe. Puede empezar a existir más adelante, pero no por reintentar ahora. |
| **500** `INTERNAL_ERROR` | Sí | Back-off exponencial con jitter, máximo 5 intentos. Si persiste, reporta el `requestId`. |
| **500** `TENANT_UNRESOLVED` | **No** | Reintentar no lo resuelve. Reporta el `requestId` a soporte. |

La API **no emite** `408`, `409`, `422`, `429`, `502`, `503` ni `504`, así que no hace falta manejarlos.

### Back-off exponencial en Node.js

```javascript
// `fn` debe lanzar un error que exponga el status. Con `fetch`, que no lanza
// ante un 4xx/5xx, hay que construirlo:
//
//   const res = await fetch(url);
//   if (!res.ok) {
//     const body = await res.json().catch(() => ({}));
//     throw Object.assign(new Error(body.message ?? res.statusText), {
//       status: res.status,
//       code: body.code,
//       requestId: body.requestId,
//     });
//   }

async function withRetry(fn, { maxAttempts = 5 } = {}) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      // Solo el 500 es reintentable en esta API: no se emiten 502, 503 ni 504.
      // Si el error no trae status, no se reintenta: se prefiere fallar visible
      // antes que repetir a ciegas.
      const status = err?.status ?? err?.response?.status;
      if (status !== 500 || attempt >= maxAttempts) throw err;

      const base = Math.min(1000 * 2 ** attempt, 30_000); // cap 30s
      const jitter = Math.random() * base * 0.3;
      await new Promise((r) => setTimeout(r, base + jitter));
    }
  }
}
```

## Un caso que no es un error: `unsignedCount`

Una respuesta `200` puede traer `unsignedCount` en el envelope. Cuenta los documentos de esa página cuya **URL de descarga no se pudo firmar**: salen sin campo `url`.

No es un error —el resto de la página es válido y utilizable— pero tampoco es normal. Existe justamente para que el fallo no sea silencioso y puedas distinguir *"este documento no tiene archivo"* de *"no se pudo generar su URL"*.

Si aparece de forma recurrente, repórtalo con el `requestId`.

## Cómo reportar un error

Cuando contactes al soporte de EURUS PRO, incluye **siempre**:

1. El `requestId` de la respuesta (o el header `X-Request-Id`).
2. El timestamp aproximado del request (UTC).
3. El método HTTP y el path (ej. `GET /{idAgencia}/v1/dispatch/files/{numeroDespacho}`).
4. Tu `idAgencia` y el `rut` consultado — **nunca el API Key**.
5. Los primeros y últimos 4 caracteres del API Key usado, si es relevante.
6. Un resumen de los parámetros enviados.
7. La respuesta completa recibida.

El `requestId` es el dato que más acelera la búsqueda: aparece en los logs estructurados del backend junto a la operación que falló.
