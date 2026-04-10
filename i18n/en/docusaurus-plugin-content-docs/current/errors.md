---
id: errors
title: Errors
sidebar_position: 6
slug: /errors
description: Standard error format and code catalog of the Comex API.
---

# Errors

The Comex API uses a **standard error format** for all responses with HTTP code ≥ 400. This lets you have a single error handler in your client, regardless of the endpoint.

## Standard format

All error responses use `Content-Type: application/json` and a body with this structure:

```json
{
  "code": "INVALID_ARGUMENT",
  "message": "The 'rut' parameter is required.",
  "details": [
    {
      "field": "rut",
      "issue": "required"
    }
  ],
  "requestId": "6b3f5c8e-1234-4abc-9def-0123456789ab"
}
```

| Field | Type | Description |
|---|---|---|
| `code` | string | Stable, machine-readable code. Use it in your logic (don't parse `message`). |
| `message` | string | Human-readable description, potentially localized. |
| `details` | array of objects | Extra information (invalid fields, values, IDs, etc.). Optional. |
| `requestId` | UUID | Unique request identifier. **Always include it when reporting issues to support.** |

:::tip Use `code`, not `message`
The `message` field may change between versions or languages. Your client logic should branch on `code`, which is stable.
:::

## HTTP code catalog

| HTTP | Code | Meaning |
|---|---|---|
| **400** | `INVALID_ARGUMENT` | Request is syntactically correct but a parameter is invalid. |
| **400** | `MALFORMED_BODY` | Body is not valid JSON or does not match the schema. |
| **401** | `UNAUTHENTICATED` | API Key missing, expired or revoked. |
| **403** | `PERMISSION_DENIED` | Valid API Key but no permission for the resource. |
| **403** | `IP_NOT_ALLOWED` | Source IP not in the API Key's allowlist. |
| **404** | `NOT_FOUND` | Requested resource does not exist or is out of the key's scope. |
| **409** | `CONFLICT` | State conflict (e.g. trying to cancel an already closed operation). |
| **409** | `DUPLICATE` | A resource with the same unique identifiers already exists. |
| **422** | `BUSINESS_RULE_VIOLATION` | Request is syntactically valid but violates a business rule. |
| **429** | `RATE_LIMITED` | You exceeded the request limit. Check `X-RateLimit-*` headers. |
| **500** | `INTERNAL` | Unexpected server error. Report the `requestId` to support. |
| **503** | `UNAVAILABLE` | Service temporarily unavailable. Retry with back-off. |

## Examples

### 400 — Invalid argument

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "code": "INVALID_ARGUMENT",
  "message": "The 'rut' parameter must contain digits only (no dots, dashes or letters).",
  "details": [
    { "field": "rut", "value": "76.543.210-K", "issue": "invalid_format" }
  ],
  "requestId": "b1e8a9c2-0000-4fff-a000-100000000001"
}
```

### 401 — Unauthenticated

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "code": "UNAUTHENTICATED",
  "message": "API Key missing or invalid.",
  "requestId": "b1e8a9c2-0000-4fff-a000-100000000002"
}
```

### 422 — Business rule

```http
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/json

{
  "code": "BUSINESS_RULE_VIOLATION",
  "message": "The date range cannot exceed 90 days.",
  "details": [
    { "rule": "max_date_range_days", "max": 90, "requested": 180 }
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
  "message": "You exceeded the 60-requests-per-minute limit.",
  "requestId": "b1e8a9c2-0000-4fff-a000-100000000004"
}
```

## Retry strategy

| Code | Retry? | How |
|---|---|---|
| `4xx` (except 408, 429) | **No** | Client errors — retrying won't help. Fix the request. |
| `408 Request Timeout` | Yes | Immediate retry, then back-off. |
| `429 Rate Limited` | Yes | Respect `Retry-After` or `X-RateLimit-Reset`. |
| `500`, `502`, `503`, `504` | Yes | Exponential back-off with jitter, max 5 attempts. |

### Exponential back-off example in Node.js

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

## How to report an error

When contacting EURUS PRO support, **always** include:

1. The `requestId` from the error response.
2. The approximate request timestamp (UTC).
3. The HTTP method and path (e.g. `GET /{idAgencia}/v1/dispatch/files/{numeroDespacho}`).
4. Your `idAgencia` and the `rut` queried (without the API Key).
5. The first/last 4 characters of the API Key used (never the full key).
6. A summary of the parameters sent (no sensitive data).
7. The full response received.

This accelerates traceability in the EURUS PRO team's logs.
