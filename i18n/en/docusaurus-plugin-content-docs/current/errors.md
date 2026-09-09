---
id: errors
title: Errors
sidebar_position: 6
slug: /errors
description: Standard error format and the real code catalog of the Comex API.
---

# Errors

The Comex API uses a **single error format** for every response with an HTTP code ≥ 400, so one handler covers all endpoints.

## Standard format

`Content-Type: application/json`, with this structure:

```json
{
  "status": 400,
  "code": "RUT_NUMBER_INVALID",
  "message": "The RUT parameter is required and must include the check digit.",
  "requestId": "6b3f5c8e-1234-4abc-9def-0123456789ab"
}
```

| Field | Type | Description |
|---|---|---|
| `status` | integer | The HTTP code, repeated in the body to simplify your logging. |
| `code` | string | Stable code. **Branch on this field**, not on `message`. |
| `message` | string | Human-readable description, **in English**. Not meant to be shown to end users untranslated. |
| `requestId` | string | Unique identifier of the invocation. **Include it when reporting an issue.** |

All four fields are **always** present. There is no `details` field.

:::tip Use `code`, not `message`
The wording of `message` can change without notice — it did change in the latest version, to fix messages that described the error incorrectly. The `code` is the contract.
:::

## `requestId` and the `X-Request-Id` header

Every response carries the invocation identifier in the `X-Request-Id` header, and errors repeat it in the body. It is how support locates your request in the logs.

**You can supply your own.** If you send `X-Request-Id` with the request, the API honours it, so a trace spanning several of your services keeps the same identifier:

| Condition | Value |
|---|---|
| Length (measured after trimming whitespace) | up to 128 characters |
| Allowed alphabet | `A-Z`, `a-z`, `0-9` and `_ . : @ + ~ / = -` |

That covers UUIDs, hexadecimal, W3C `traceparent` and Cloud Trace identifiers. A value that does not qualify **is not an error**: the API generates its own UUID and returns it in the header, so you always get a usable identifier.

## Code catalog

### Authentication and agency

| HTTP | `code` | When |
|---|---|---|
| **403** | `API_KEY_INVALID` | `?key=` is missing, or the value is not usable. Also when it arrives repeated with conflicting values. |
| **403** | `PROJECT_ID_UNAUTHORIZED` | The API Key is not authorized for the `idAgencia` in the path. |
| **400** | `PROJECT_ID_UNDEFINED` | The `idAgencia` is missing from the path, or its configuration could not be resolved. |

:::info There is no 401
Even when the API Key is **missing**, the response is `403`. An earlier version of this documentation declared `401`.
:::

### `GET /dispatch/files/{numeroDespacho}`

| HTTP | `code` | When |
|---|---|---|
| **400** | `DISPATCH_ID_INVALID` | `numeroDespacho` is empty. |
| **404** | `DISPATCH_NOT_FOUND` | The dispatch does not exist in your agency. |

### `GET /dispatch/files`

| HTTP | `code` | When |
|---|---|---|
| **400** | `RUT_NUMBER_INVALID` | `rut` is missing, or its shape is not a RUT. See [Conventions → RUT format](./conventions.md#rut-format). |
| **400** | `START_DATE_REQUIRED` | `startDate` is missing. |
| **400** | `END_DATE_REQUIRED` | `endDate` is missing. |
| **400** | `START_DATE_INVALID` | `startDate` has an unrecognized format, or is a date that does not exist. |
| **400** | `END_DATE_INVALID` | Same for `endDate`. |
| **400** | `DATE_RANGE_INVALID` | `startDate` is greater than `endDate`. |
| **400** | `FILE_TYPE_NAME_INVALID` | `fileTypeName` is missing; it is required on this endpoint. |
| **404** | `ACCOUNT_NOT_FOUND` | The RUT is well formed but is not a client, or is not active for this API. |

### `GET /master/file-types`

| HTTP | `code` | When |
|---|---|---|
| **400** | `RECORD_TYPE_INVALID` | `recordType` carries a value other than `impo` or `expo`, or arrives repeated with conflicting values. Omitting it is valid: it returns both. |

| **500** | `INTERNAL_ERROR` | Unhandled error. Here `code` is **always** `INTERNAL_ERROR`, never a data-layer code: the detail stays in the service logs, and the `requestId` is what links the two when you report it. |

:::note This endpoint never returns 404
It takes no `rut` and no dispatch identifier: an agency with no active document types answers `200` with `data: []`.
:::

### Server errors

| HTTP | `code` | When |
|---|---|---|
| **500** | `INTERNAL_ERROR` or a data-layer code | Unhandled error. |

:::warning 400 and 404 mean different things
`400 RUT_NUMBER_INVALID` says the **shape** of the RUT is invalid: the error is in your request. `404 ACCOUNT_NOT_FOUND` says the RUT is valid but **does not match an active client**: the error is in the data. Telling them apart saves you from debugging in the wrong place.
:::

## Examples

### 403 — API Key missing or invalid

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

### 400 — RUT with an invalid shape

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

### 400 — Inverted date range

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

### 404 — The RUT is not an active client

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

## Retry strategy

| Code | Retry? | How |
|---|---|---|
| **400** | **No** | It is an error in your request. Retrying returns the same result. |
| **403** | **No** | Check the API Key and the `idAgencia`. |
| **404** | **No** | The resource does not exist. It may start existing later, but not because you retried now. |
| **500** | Yes | Exponential back-off with jitter, at most 5 attempts. If it persists, report the `requestId`. |

The API **does not emit** `408`, `409`, `422`, `429`, `502`, `503` or `504`, so you do not need to handle them.

### Exponential back-off in Node.js

```javascript
// `fn` must throw an error that exposes the status. `fetch` does not throw on
// 4xx/5xx, so you have to build it:
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
      // Only 500 is retriable on this API: it emits no 502, 503 or 504.
      // If the error carries no status, do not retry: failing visibly beats
      // repeating blindly.
      const status = err?.status ?? err?.response?.status;
      if (status !== 500 || attempt >= maxAttempts) throw err;

      const base = Math.min(1000 * 2 ** attempt, 30_000); // cap 30s
      const jitter = Math.random() * base * 0.3;
      await new Promise((r) => setTimeout(r, base + jitter));
    }
  }
}
```

## Not an error: `unsignedCount`

A `200` response may carry `unsignedCount` in the envelope. It counts the documents on that page whose **download URL could not be signed**: they come back without a `url` field.

It is not an error — the rest of the page is valid and usable — but it is not normal either. It exists precisely so the failure is not silent, and so you can tell *"this document has no file"* from *"its URL could not be generated"*.

If it shows up repeatedly, report it with the `requestId`.

## How to report an error

When contacting EURUS PRO support, **always** include:

1. The `requestId` from the response (or the `X-Request-Id` header).
2. The approximate request timestamp (UTC).
3. The HTTP method and path (e.g. `GET /{idAgencia}/v1/dispatch/files/{numeroDespacho}`).
4. Your `idAgencia` and the `rut` you queried — **never the API Key**.
5. The first and last 4 characters of the API Key used, if relevant.
6. A summary of the parameters sent.
7. The full response received.

The `requestId` is the single most useful item: it appears in the backend's structured logs next to the operation that failed.
