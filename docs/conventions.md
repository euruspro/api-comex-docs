---
id: conventions
title: Convenciones
sidebar_position: 4
slug: /conventions
description: Formatos, versionado, identificadores, paginación, rate limits y códigos HTTP de la API Comex.
---

# Convenciones

Esta página describe los estándares y convenciones que la API Comex de EURUS PRO aplica de forma transversal a todos los endpoints. Conocerlas te ahorrará sorpresas al integrar.

## Base URL y versionado

La URL base de la API incluye **dos elementos variables** antes del path del recurso:

```
https://api-comex.eurus.pro/{idAgencia}/v1/...
```

| Segmento | Descripción |
|---|---|
| `{idAgencia}` | Identificador numérico de tu agencia EURUS PRO. Se asigna al provisionar el acceso. |
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

Segmento numérico que identifica tu agencia EURUS PRO. Forma parte del path, antes de `/v1`.

```
https://api-comex.eurus.pro/12345/v1/...
                           ^^^^^
                           idAgencia
```

### `key` (query, obligatorio)

API Key que autentica la llamada. Ver [Autenticación](./authentication.md).

### `rut` (query, obligatorio en la mayoría de endpoints)

RUT del cliente final del que estás consultando datos.

#### Formato de RUT

El parámetro `rut` debe enviarse en un **formato normalizado** muy estricto:

- **Solo dígitos**.
- **Sin puntos** (`.`).
- **Sin guion** (`-`).
- **Sin la letra verificadora como letra**. Si el RUT termina en `K`, **reemplaza la K por `1`**.

| RUT formato común | `rut` en la API |
|---|---|
| `76.543.210-K` | `765432101` |
| `12.345.678-9` | `123456789` |
| `9.876.543-2` | `98765432` |
| `1-9` | `19` |

#### Helper en JavaScript

```javascript
function normalizarRut(rut) {
  // Elimina puntos, guion y espacios
  const limpio = rut.replace(/[.\-\s]/g, "").toUpperCase();
  // Reemplaza K final por 1
  return limpio.endsWith("K") ? limpio.slice(0, -1) + "1" : limpio;
}

normalizarRut("76.543.210-K"); // "765432101"
normalizarRut("12.345.678-9"); // "123456789"
```

#### Helper en Python

```python
def normalizar_rut(rut: str) -> str:
    limpio = rut.replace(".", "").replace("-", "").replace(" ", "").upper()
    return limpio[:-1] + "1" if limpio.endswith("K") else limpio

normalizar_rut("76.543.210-K")  # "765432101"
normalizar_rut("12.345.678-9")  # "123456789"
```

## Formato de request y response

- **Content type**: `application/json` en request body y response body.
- **Charset**: UTF-8.
- **Fechas**: en los parámetros (`startDate`, `endDate`) usa formato `YYYY-MM-DD` (ISO 8601). En las respuestas, timestamps en formato **ISO 8601 con zona horaria UTC** (`2026-04-10T15:02:44Z`).
- **Identificadores**: los `numeroDespacho` y `fileName` son strings.
- **Nombres de campos**: `camelCase` en responses.

### Headers recomendados

| Header | Valor | Notas |
|---|---|---|
| `Accept` | `application/json` | Recomendado incluir explícitamente. |
| `Accept-Language` | `es` o `en` | Idioma preferido para mensajes de error legibles. |
| `User-Agent` | `MiApp/1.2.3 (+https://miapp.com)` | Recomendado — ayuda al soporte a identificar tu tráfico. |

## Paginación

:::note Placeholder
Los endpoints actualmente disponibles devuelven todos los resultados en una sola respuesta (con un campo `total`). Si los volúmenes crecen, se añadirá paginación por parámetros `page` y `limit`, documentados en una próxima versión.
:::

## Rate limits

La API aplica límites de tasa para proteger la plataforma:

| Plan | Requests/minuto | Requests/día |
|---|---|---|
| **Default** | 60 | 10 000 |
| **Empresa** | A convenir | A convenir |

:::note Placeholder
Los límites exactos se confirmarán antes del release público.
:::

Cuando superas un límite, la API responde con **HTTP 429** y los siguientes headers estándar:

| Header | Descripción |
|---|---|
| `X-RateLimit-Limit` | Límite total de la ventana actual. |
| `X-RateLimit-Remaining` | Requests restantes antes del reset. |
| `X-RateLimit-Reset` | Epoch timestamp (segundos) en que se resetea la ventana. |
| `Retry-After` | Segundos a esperar antes de reintentar. |

**Recomendación**: implementa **back-off exponencial con jitter** ante respuestas 429 o 5xx.

## Códigos HTTP usados

| Código | Significado | Cuándo |
|---|---|---|
| **200** OK | Éxito. | GET exitoso. |
| **400** Bad Request | Request mal formado. | Parámetros faltantes, tipos incorrectos, RUT en formato inválido, fechas mal formadas. |
| **401** Unauthorized | API Key ausente o inválido. | Falta `?key=...` o el key fue revocado. |
| **403** Forbidden | Sin permisos. | API Key válido pero sin acceso al recurso o RUT. |
| **404** Not Found | Recurso no existe. | `numeroDespacho` inexistente o fuera del alcance del key/RUT. |
| **429** Too Many Requests | Rate limit excedido. | Implementa back-off. |
| **500** Internal Server Error | Error del servidor. | Reintentar con back-off, reportar si persiste. |
| **503** Service Unavailable | Mantenimiento / sobrecarga. | Reintentar con back-off. |

Ver [Errores](./errors.md) para el formato estándar del cuerpo de error y el catálogo de códigos aplicativos.
