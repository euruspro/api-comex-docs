---
id: conventions
title: Conventions
sidebar_position: 4
slug: /conventions
description: Formats, versioning, pagination, rate limits and HTTP codes of the Comex API.
---

# Conventions

This page describes the standards and conventions that the Comex API applies across all endpoints. Knowing them will save you surprises when integrating.

## Versioning

The API uses **URL versioning**: the major version is part of the path, after the product segment:

```
https://api.euruspro.com/comex/v1/...
```

- **Breaking changes** are published under a new major version (`/v2`).
- **Non-breaking changes** (new optional fields, new endpoints) are added to the current version.
- Previous versions remain active during a migration period announced in the [Changelog](./changelog.md).

:::info Deprecation policy
When an endpoint or field is marked as deprecated, it will be announced in the Changelog at least 90 days before removal.
:::

## Request and response format

- **Content type**: `application/json` for both request and response bodies.
- **Charset**: UTF-8.
- **Dates**: always in **ISO 8601 with UTC timezone** (`2026-04-10T15:02:44Z`).
- **Identifiers**: canonical UUID v4 (`8e4d9b12-fe6a-4f88-a1b5-123456789abc`).
- **Country codes**: ISO 3166-1 alpha-2 (`CL`, `AR`, `US`, `DE`, ...).
- **Currency codes**: ISO 4217 (`USD`, `CLP`, `EUR`, ...).
- **Field naming**: `camelCase`.
- **Decimal numbers**: no thousands separator, `.` as decimal separator (`3.25`).

### Recommended headers

| Header | Value | Notes |
|---|---|---|
| `Accept` | `application/json` | Recommended to include explicitly. |
| `Content-Type` | `application/json` | Required on requests with body (POST, PUT, PATCH). |
| `Accept-Language` | `es` or `en` | Preferred language for human-readable error messages. |
| `User-Agent` | `MyApp/1.2.3 (+https://myapp.com)` | Recommended — helps support identify your traffic. |

## Pagination

Endpoints returning collections support cursor- or offset-based pagination. The default pattern is **offset-based** with these query parameters:

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | integer ≥ 1 | `1` | Page number (1-indexed). |
| `limit` | integer 1–100 | `20` | Page size. |

The response includes pagination metadata:

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

### Example

```bash
curl "https://api.euruspro.com/comex/v1/exportaciones?page=2&limit=50&key=$EURUS_API_KEY"
```

:::note Placeholder
The pagination scheme shown is the initial plan. The final format will be confirmed before the public release.
:::

## Filtering and sorting

- **Filters**: passed as query parameters with the field name (`?estado=REGISTRADA&paisDestino=CL`).
- **Sorting**: `sort` parameter with the field and direction (`?sort=-createdAt` for descending, `?sort=createdAt` for ascending).
- **Text search** (where applicable): `q` parameter.

## Rate limits

The API enforces rate limits to protect the platform:

| Plan | Requests/minute | Requests/day |
|---|---|---|
| **Default** | 60 | 10,000 |
| **Enterprise** | TBD | TBD |

:::note Placeholder
Exact limits will be confirmed before the public release.
:::

When you exceed a limit, the API responds with **HTTP 429** and these standard headers:

| Header | Description |
|---|---|
| `X-RateLimit-Limit` | Total limit of the current window. |
| `X-RateLimit-Remaining` | Remaining requests before reset. |
| `X-RateLimit-Reset` | Epoch timestamp (seconds) at which the window resets. |
| `Retry-After` | Seconds to wait before retrying. |

**Recommendation**: implement **exponential back-off with jitter** on 429 or 5xx responses.

## HTTP codes used

| Code | Meaning | When |
|---|---|---|
| **200** OK | Success. | Successful GET, PUT, PATCH. |
| **201** Created | Resource created. | Successful POST. |
| **204** No Content | Success without body. | Successful DELETE. |
| **400** Bad Request | Malformed request. | Invalid JSON, missing fields, wrong types. |
| **401** Unauthorized | API Key missing or invalid. | `?key=...` missing or revoked. |
| **403** Forbidden | No permissions. | Valid API Key but no access to the resource. |
| **404** Not Found | Resource does not exist. | Nonexistent ID or out of key's scope. |
| **409** Conflict | State conflict. | Attempt to perform an invalid operation given the current state. |
| **422** Unprocessable Entity | Business rule validation failed. | Business rules, not just syntax. |
| **429** Too Many Requests | Rate limit exceeded. | Implement back-off. |
| **500** Internal Server Error | Server error. | Retry with back-off, report if persistent. |
| **503** Service Unavailable | Maintenance / overload. | Retry with back-off. |

See [Errors](./errors.md) for the standard error body format and the application-level code catalog.

## Idempotency

For `POST` operations that create resources, you can send the header:

```
Idempotency-Key: <uuid-v4-unique-per-logical-attempt>
```

The API guarantees that two requests with the same `Idempotency-Key` (within a 24-hour window) will not create duplicate resources. Use it whenever a network timeout or failure forces you to retry.

:::note Placeholder
Idempotency support is planned. Check its availability per endpoint in the reference.
:::
