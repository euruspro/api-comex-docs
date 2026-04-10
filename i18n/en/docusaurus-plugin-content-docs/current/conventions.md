---
id: conventions
title: Conventions
sidebar_position: 4
slug: /conventions
description: Formats, versioning, identifiers, pagination, rate limits and HTTP codes of the Comex API.
---

# Conventions

This page describes the standards and conventions that the Comex API applies across all endpoints. Knowing them will save you surprises when integrating.

## Base URL and versioning

The API base URL includes **two variable elements** before the resource path:

```
https://api-comex.eurus.pro/{idAgencia}/v1/...
```

| Segment | Description |
|---|---|
| `{idAgencia}` | Your EURUS PRO agency numeric identifier. Assigned when access is provisioned. |
| `v1` | API major version. |

- **Breaking changes** are published under a new major version (`/v2`).
- **Non-breaking changes** (new optional fields, new endpoints) are added to the current version.
- Previous versions remain active during a migration period announced in the [Changelog](./changelog.md).

:::info Deprecation policy
When an endpoint or field is marked as deprecated, it will be announced in the Changelog at least 90 days before removal.
:::

## Common identifiers

Almost every call to the Comex API involves these three identifiers:

### `idAgencia` (path)

Numeric segment identifying your EURUS PRO agency. Part of the path, before `/v1`.

```
https://api-comex.eurus.pro/12345/v1/...
                           ^^^^^
                           idAgencia
```

### `key` (query, required)

API Key that authenticates the call. See [Authentication](./authentication.md).

### `rut` (query, required on most endpoints)

End client RUT you're querying data for.

#### RUT format

The `rut` parameter must be sent in a **strictly normalized format**:

- **Digits only**.
- **No dots** (`.`).
- **No dashes** (`-`).
- **No verifier letter as a letter**. If the RUT ends in `K`, **replace the K with `1`**.

| Common RUT format | `rut` in the API |
|---|---|
| `76.543.210-K` | `765432101` |
| `12.345.678-9` | `123456789` |
| `9.876.543-2` | `98765432` |
| `1-9` | `19` |

#### JavaScript helper

```javascript
function normalizeRut(rut) {
  // Remove dots, dashes and spaces
  const clean = rut.replace(/[.\-\s]/g, "").toUpperCase();
  // Replace trailing K with 1
  return clean.endsWith("K") ? clean.slice(0, -1) + "1" : clean;
}

normalizeRut("76.543.210-K"); // "765432101"
normalizeRut("12.345.678-9"); // "123456789"
```

#### Python helper

```python
def normalize_rut(rut: str) -> str:
    clean = rut.replace(".", "").replace("-", "").replace(" ", "").upper()
    return clean[:-1] + "1" if clean.endswith("K") else clean

normalize_rut("76.543.210-K")  # "765432101"
normalize_rut("12.345.678-9")  # "123456789"
```

## Request and response format

- **Content type**: `application/json` for request and response bodies.
- **Charset**: UTF-8.
- **Dates**: in parameters (`startDate`, `endDate`) use `YYYY-MM-DD` (ISO 8601). In responses, timestamps in **ISO 8601 with UTC timezone** (`2026-04-10T15:02:44Z`).
- **Identifiers**: `numeroDespacho` and `fileName` are strings.
- **Field names**: `camelCase` in responses.

### Recommended headers

| Header | Value | Notes |
|---|---|---|
| `Accept` | `application/json` | Recommended to include explicitly. |
| `Accept-Language` | `es` or `en` | Preferred language for human-readable error messages. |
| `User-Agent` | `MyApp/1.2.3 (+https://myapp.com)` | Recommended — helps support identify your traffic. |

## Pagination

:::note Placeholder
Currently available endpoints return all results in a single response (with a `total` field). If volumes grow, pagination will be added via `page` and `limit` parameters, documented in a future version.
:::

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
| **200** OK | Success. | Successful GET. |
| **400** Bad Request | Malformed request. | Missing parameters, wrong types, invalid RUT format, malformed dates. |
| **401** Unauthorized | API Key missing or invalid. | `?key=...` missing or revoked. |
| **403** Forbidden | No permissions. | Valid API Key but no access to the resource or RUT. |
| **404** Not Found | Resource does not exist. | Nonexistent `numeroDespacho` or out of key/RUT scope. |
| **429** Too Many Requests | Rate limit exceeded. | Implement back-off. |
| **500** Internal Server Error | Server error. | Retry with back-off, report if persistent. |
| **503** Service Unavailable | Maintenance / overload. | Retry with back-off. |

See [Errors](./errors.md) for the standard error body format and the application-level code catalog.
