---
id: conventions
title: Convenciones
sidebar_position: 4
slug: /conventions
description: Formatos, versionado, paginación, rate limits y códigos HTTP de la API Comex.
---

# Convenciones

Esta página describe los estándares y convenciones que la API Comex de EURUS PRO aplica de forma transversal a todos los endpoints. Conocerlas te ahorrará sorpresas al integrar.

## Versionado

La API utiliza **versionado por URL**: el número mayor de versión forma parte del path, después del segmento de producto:

```
https://api.euruspro.com/comex/v1/...
```

- **Cambios breaking** se publican en una nueva versión mayor (`/v2`).
- **Cambios no-breaking** (nuevos campos opcionales, nuevos endpoints) se añaden a la versión actual.
- Las versiones anteriores se mantienen activas durante un período de migración que se anunciará en el [Changelog](./changelog.md).

:::info Política de deprecación
Cuando un endpoint o campo se marque como deprecated, se anunciará en el Changelog con al menos 90 días de anticipación antes de su retirada.
:::

## Formato de request y response

- **Content type**: `application/json` en request body y response body.
- **Charset**: UTF-8.
- **Fechas**: siempre en formato **ISO 8601 con zona horaria UTC** (`2026-04-10T15:02:44Z`).
- **Identificadores**: UUID v4 en formato canónico (`8e4d9b12-fe6a-4f88-a1b5-123456789abc`).
- **Códigos de país**: ISO 3166-1 alpha-2 (`CL`, `AR`, `US`, `DE`, ...).
- **Códigos de moneda**: ISO 4217 (`USD`, `CLP`, `EUR`, ...).
- **Nombres de campos**: `camelCase`.
- **Números decimales**: sin separador de miles, con `.` como separador decimal (`3.25`).

### Headers recomendados

| Header | Valor | Notas |
|---|---|---|
| `Accept` | `application/json` | Recomendado incluir explícitamente. |
| `Content-Type` | `application/json` | Obligatorio en requests con body (POST, PUT, PATCH). |
| `Accept-Language` | `es` o `en` | Idioma preferido para mensajes de error legibles. |
| `User-Agent` | `MiApp/1.2.3 (+https://miapp.com)` | Recomendado — ayuda al soporte a identificar tu tráfico. |

## Paginación

Los endpoints que devuelven colecciones soportan paginación por cursor o por offset. El patrón por defecto es **offset-based** con los siguientes parámetros de query:

| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | entero ≥ 1 | `1` | Número de página (1-indexed). |
| `limit` | entero 1–100 | `20` | Tamaño de la página. |

La respuesta incluye metadatos de paginación:

```json
{
  "data": [ /* ... items ... */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 157,
    "totalPages": 8
  }
}
```

### Ejemplo

```bash
curl "https://api.euruspro.com/comex/v1/exportaciones?page=2&limit=50&key=$EURUS_API_KEY"
```

:::note Placeholder
El esquema de paginación mostrado es el plan inicial. El formato definitivo se confirmará antes del release público.
:::

## Filtros y ordenamiento

- **Filtros**: pasados como query parameters con el nombre del campo (`?estado=REGISTRADA&paisDestino=CL`).
- **Ordenamiento**: parámetro `sort` con el campo y dirección (`?sort=-createdAt` para descendente, `?sort=createdAt` para ascendente).
- **Búsqueda por texto** (cuando aplique): parámetro `q`.

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
| **200** OK | Éxito. | GET, PUT, PATCH exitosos. |
| **201** Created | Recurso creado. | POST exitoso. |
| **204** No Content | Éxito sin cuerpo. | DELETE exitoso. |
| **400** Bad Request | Request mal formado. | JSON inválido, campos faltantes, tipos incorrectos. |
| **401** Unauthorized | API Key ausente o inválido. | Falta `?key=...` o el key fue revocado. |
| **403** Forbidden | Sin permisos. | API Key válido pero sin acceso al recurso. |
| **404** Not Found | Recurso no existe. | ID inexistente o fuera del alcance del key. |
| **409** Conflict | Conflicto de estado. | Intento de operación inválida dado el estado actual. |
| **422** Unprocessable Entity | Validación de negocio fallida. | Reglas de negocio, no solo sintaxis. |
| **429** Too Many Requests | Rate limit excedido. | Implementa back-off. |
| **500** Internal Server Error | Error del servidor. | Reintentar con back-off, reportar si persiste. |
| **503** Service Unavailable | Mantenimiento / sobrecarga. | Reintentar con back-off. |

Ver [Errores](./errors.md) para el formato estándar del cuerpo de error y el catálogo de códigos aplicativos.

## Idempotencia

Para operaciones `POST` que crean recursos, puedes enviar el header:

```
Idempotency-Key: <uuid-v4-único-por-intento-lógico>
```

La API garantiza que dos requests con la misma `Idempotency-Key` (dentro de una ventana de 24 horas) no crearán recursos duplicados. Úsalo siempre que un timeout o fallo de red te obligue a reintentar.

:::note Placeholder
El soporte de idempotencia está planeado. Confirma su disponibilidad para cada endpoint en la referencia.
:::
