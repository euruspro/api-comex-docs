---
id: errors
title: Errores
sidebar_position: 6
slug: /errors
description: Formato estándar de errores y catálogo de códigos de la API Comex.
---

# Errores

La API Comex usa un **formato estándar de error** para todas las respuestas con código HTTP ≥ 400. Esto te permite tener un único handler de errores en tu cliente, independientemente del endpoint.

## Formato estándar

Todas las respuestas de error tienen `Content-Type: application/json` y un cuerpo con esta estructura:

```json
{
  "code": "INVALID_ARGUMENT",
  "message": "El campo 'incoterm' no puede estar vacío.",
  "details": [
    {
      "field": "incoterm",
      "issue": "required"
    }
  ],
  "requestId": "6b3f5c8e-1234-4abc-9def-0123456789ab"
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `code` | string | Código estable y legible. Úsalo en tu lógica (no parsees `message`). |
| `message` | string | Descripción human-readable del error, potencialmente localizada. |
| `details` | array de objects | Información adicional (campos inválidos, valores, IDs, etc.). Opcional. |
| `requestId` | UUID | Identificador único del request. **Inclúyelo siempre al reportar problemas a soporte.** |

:::tip Usa `code`, no `message`
El campo `message` puede cambiar entre versiones o idiomas. La lógica de tu cliente debe ramificar sobre `code`, que es estable.
:::

## Catálogo de códigos HTTP

| HTTP | Código | Significado |
|---|---|---|
| **400** | `INVALID_ARGUMENT` | El request es sintácticamente correcto pero un parámetro es inválido. |
| **400** | `MALFORMED_BODY` | El cuerpo no es JSON válido o no matchea el schema. |
| **401** | `UNAUTHENTICATED` | API Key ausente, expirado o revocado. |
| **403** | `PERMISSION_DENIED` | API Key válido pero sin permisos para el recurso. |
| **403** | `IP_NOT_ALLOWED` | La IP de origen no está en el allowlist del API Key. |
| **404** | `NOT_FOUND` | El recurso solicitado no existe o está fuera del alcance del key. |
| **409** | `CONFLICT` | Conflicto de estado (ej. intentar anular una operación ya cerrada). |
| **409** | `DUPLICATE` | Ya existe un recurso con los mismos identificadores únicos. |
| **422** | `BUSINESS_RULE_VIOLATION` | La request es válida sintácticamente pero viola una regla de negocio. |
| **429** | `RATE_LIMITED` | Has superado el límite de requests. Revisa los headers `X-RateLimit-*`. |
| **500** | `INTERNAL` | Error inesperado del servidor. Reporta el `requestId` a soporte. |
| **503** | `UNAVAILABLE` | Servicio temporalmente no disponible. Reintentar con back-off. |

## Ejemplos

### 400 — Argumento inválido

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "code": "INVALID_ARGUMENT",
  "message": "El campo 'paisDestino' debe ser un código ISO-2 válido.",
  "details": [
    { "field": "paisDestino", "value": "CHILE", "issue": "invalid_format" }
  ],
  "requestId": "b1e8a9c2-0000-4fff-a000-100000000001"
}
```

### 401 — No autenticado

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "code": "UNAUTHENTICATED",
  "message": "API Key ausente o inválido.",
  "requestId": "b1e8a9c2-0000-4fff-a000-100000000002"
}
```

### 422 — Regla de negocio

```http
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/json

{
  "code": "BUSINESS_RULE_VIOLATION",
  "message": "No se puede registrar una exportación sin al menos un ítem con valor > 0.",
  "details": [
    { "rule": "items_total_gt_zero", "total": 0 }
  ],
  "requestId": "b1e8a9c2-0000-4fff-a000-100000000003"
}
```

### 429 — Rate limit

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 42
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1744303200

{
  "code": "RATE_LIMITED",
  "message": "Has superado el límite de 60 requests por minuto.",
  "requestId": "b1e8a9c2-0000-4fff-a000-100000000004"
}
```

## Estrategia de reintentos

| Código | ¿Reintentar? | Cómo |
|---|---|---|
| `4xx` (excepto 408, 429) | **No** | Son errores del cliente — reintentar no ayudará. Corrige el request. |
| `408 Request Timeout` | Sí | Reintento inmediato, luego back-off. |
| `429 Rate Limited` | Sí | Respeta `Retry-After` o `X-RateLimit-Reset`. |
| `500`, `502`, `503`, `504` | Sí | Back-off exponencial con jitter, máximo 5 intentos. |

### Ejemplo de back-off exponencial en Node.js

```javascript
async function withRetry(fn, { maxAttempts = 5 } = {}) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      const status = err.response?.status;
      const retriable = status === 408 || status === 429 || (status >= 500 && status < 600);
      if (!retriable || attempt >= maxAttempts) throw err;

      const base = Math.min(1000 * 2 ** attempt, 30_000); // cap 30s
      const jitter = Math.random() * base * 0.3;
      const delay = base + jitter;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}
```

## Cómo reportar un error

Cuando contactes al soporte de EURUS PRO, incluye **siempre**:

1. El `requestId` de la respuesta de error.
2. El timestamp aproximado del request (UTC).
3. El método HTTP y path (ej. `POST /v1/exportaciones`).
4. Los primeros/últimos 4 caracteres del API Key usado (nunca el key completo).
5. Un resumen del payload enviado (sin datos sensibles).
6. La respuesta completa recibida.

Esto acelera la trazabilidad en los logs del equipo de EURUS PRO.
