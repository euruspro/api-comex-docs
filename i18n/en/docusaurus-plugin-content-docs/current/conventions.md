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
| `{idAgencia}` | Your EURUS PRO agency identifier. It is an opaque string, not a number: treat it as a literal. Assigned when access is provisioned. |
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

Segment identifying your EURUS PRO agency. Part of the path, before `/v1`.

```
https://api-comex.eurus.pro/z_cl_demo/v1/...
                           ^^^^^^^^^
                           idAgencia
```

Do not assume it is numeric or of fixed length: it is an opaque string. If your API Key is not authorized for the `idAgencia` in the path, the response is `403 PROJECT_ID_UNAUTHORIZED`.

### `key` (query, required)

API Key that authenticates the call. See [Authentication](./authentication.md).

### `rut` (query, required on most endpoints)

End client RUT you're querying data for.

#### RUT format

The `rut` parameter is the **body plus the check digit**. The API accepts several presentation forms and normalizes them internally to the same query:

| What you send | Queried as |
|---|---|
| `999999999` | `999999999` |
| `99999999-9` | `999999999` |
| `99.999.999-9` | `999999999` |
| `99999999K` / `99999999-k` | `999999991` |

The canonical form — digits only, with `K` folded to `1` — is the one we recommend: it is what the API uses internally and leaves the least ambiguity. The helpers below produce it.

**What gets rejected** with `400 RUT_NUMBER_INVALID`, because it is not a RUT:

| Input | Why it is rejected |
|---|---|
| `1e2` | Scientific notation. |
| `0x7B` | Hexadecimal. |
| `123.0` | Decimal; dots are only valid as thousands separators. |
| `1234567.890` | Dots that are not the thousands grouping of the body. |
| `076501137` | Leading zero: it would change the numeric value queried. |
| `-999999999` | Sign. |

Length is **not** validated. A well-formed RUT that does not match an active client returns `404 ACCOUNT_NOT_FOUND`, not a `400`: the distinction tells you whether the error is in your request or in the data.

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

- **Content type**: `application/json`.
- **Charset**: UTF-8.
- **Field names**: `camelCase` in responses.
- **Identifiers**: `numeroDespacho` and `id` are strings, even when their content looks numeric. Do not parse them as integers.
- **Dates in parameters** (`startDate`, `endDate`): `YYYY-MM-DD` or `YYYY-MM-DD HH:mm`, interpreted in **`America/Santiago`**. See [Time zone](#time-zone-of-date-ranges).
- **Dates emitted by the API**: ISO 8601 in UTC (`2026-01-31T22:04:31.000Z`). The exception is the values inside `infoDoc`, which come from AI extraction **unnormalized**, with no guaranteed format.

### Value conventions

Firestore is NoSQL: the API **does not enforce field lengths**. What follows is guidance for your own modelling, not a contract guarantee:

| Type | Convention | Example |
|---|---|---|
| Timestamps emitted by the API | ISO 8601 with zone | `2026-01-31T22:04:31.000Z` |
| Dates in parameters | `YYYY-MM-DD` or `YYYY-MM-DD HH:mm` | `2026-01-31` |
| Integers | No decimals | `15000` |
| Decimal numbers | Up to 4 decimals (e.g. exchange rate) | `850.2534` |
| Strings | No declared limit | — |

## Field presence: the thing that surprises integrators most

This is the convention worth reading before you write the first line of code.

Before serializing the response, the API **recursively removes every property whose value is `null`, `undefined` or `""`** (empty string).

| Value | What happens to the key |
|---|---|
| `null`, `undefined`, `""` | **removed from the JSON** |
| `false`, `0` | kept |
| Object left with no properties | kept, as `{}` |
| Array | cleaned element by element |

The consequence:

:::warning Key presence is not guaranteed
A field present in one element **may be missing from the next one in the same response**, because its value was empty — not because it does not apply. Treat every optional field as potentially absent.
:::

### The only guarantees

On `GET /dispatch/files` (both variants), every element of `data` always carries these four:

| Field | Why it is always there |
|---|---|
| `id` | Assigned from the document ID. |
| `isActive` | Falls back to `false`, and `false` is not removed. |
| `dispatch` | It is a container object; empty objects are kept. |
| `infoDoc` | Same: it survives as `{}`. |

A document with no populated fields returns exactly this:

```json
{ "id": "FILE-001", "isActive": false, "dispatch": {}, "infoDoc": {} }
```

### The empty-object trap

`dispatch` and `infoDoc` **always exist, but may come back empty**. And in JavaScript `{}` is truthy, so this does not work:

```javascript
// ❌ Runs even when infoDoc = {}
if (item.infoDoc) {
  console.log(item.infoDoc.document.number); // TypeError
}
```

Check **content**, not presence:

```javascript
// ✅
if (item.infoDoc?.document?.number) {
  console.log(item.infoDoc.document.number);
}
```

In Python the truthiness problem does not appear — an empty dict is falsy — but nested access still needs care:

```python
number = (item.get("infoDoc") or {}).get("document", {}).get("number")
if number:
    ...
```

## Time zone of date ranges

The `startDate` and `endDate` parameters are interpreted in **`America/Santiago`**, not UTC.

With no explicit time, the range covers the full day in that zone:

| Parameter | Anchored to |
|---|---|
| `startDate=2026-01-15` | `2026-01-15 00:00:00.000` in Chile |
| `endDate=2026-01-15` | `2026-01-15 23:59:59.999` in Chile |

The comparison is **inclusive at both ends**. Chile observes daylight saving time, so the offset from UTC changes with the date of the range (`-03:00` or `-04:00`): if you convert to UTC on your side, use a library with a time-zone database, not a fixed offset.

A date that does not exist in the calendar (`2026-02-30`) is rejected with `400`.

### Recommended headers

| Header | Value | Notes |
|---|---|---|
| `Accept` | `application/json` | Recommended to include explicitly. |
| `Accept-Language` | `es` or `en` | Preferred language for human-readable error messages. |
| `User-Agent` | `MyApp/1.2.3 (+https://myapp.com)` | Recommended — helps support identify your traffic. |

## Pagination

Pagination is **cursor-based**, with a **fixed limit of 100 elements** per page. There are no `page`, `limit` or `offset` parameters, and **there is no `total` field**: the API does not report the total number of results.

| Element | Where | Behaviour |
|---|---|---|
| `nextToken` | In the response | Present **only if the page returned exactly 100 elements**. Absent on the last page. |
| `?nextToken=` | In the request | The value received in the previous response. Omit it for the first page. |

### How to break the loop

**The stop condition is the absence of `nextToken`.** Do not compare the contents of two pages, and do not count elements.

```javascript
const documents = [];
let nextToken;

do {
  const params = new URLSearchParams({ key, rut, fileTypeName, startDate, endDate });
  if (nextToken) params.set("nextToken", nextToken);

  const res = await fetch(`${BASE}/dispatch/files?${params}`);
  if (!res.ok) throw new Error(`${res.status} ${(await res.json()).code}`);

  const page = await res.json();
  documents.push(...page.data);
  nextToken = page.nextToken;   // undefined on the last page
} while (nextToken);
```

Two behaviours worth tolerating explicitly:

:::warning An empty last page is normal
A total of **exactly 100** results returns a `nextToken` whose next page comes back with `data: []`. It is not an error: it is how the walk ends.
:::

:::warning An invalid `nextToken` is not an error
If the token does not match an existing document — because the document was deleted in the meantime, for instance — **it is silently ignored and the first page is returned**. If your stop condition compared pages instead of checking for the absence of `nextToken`, it might never terminate.
:::

## Rate limits

**There are currently no declared rate limits** for these endpoints, and the API **does not emit `429`** or `X-RateLimit-*` headers.

Do not read that as an invitation to consume without restraint: it is a configuration that can change, and behaviour without declared limits is not a contract guarantee. When quotas are defined they will be announced in the [Changelog](./changelog.md) before taking effect.

**Recommendations that do apply today**:

- **Exponential back-off with jitter** on `500`. That is the code that can appear from a transient data-layer error.
- **Paginate serially, not in parallel.** Cursor pagination requires it anyway: you need one page's `nextToken` to request the next.
- For large historical loads, **narrow by date ranges** instead of walking everything at once.

## HTTP codes used

| Code | Meaning | When |
|---|---|---|
| **200** OK | Success. | Successful GET. `data: []` is also a `200`. |
| **400** Bad Request | Malformed request. | Missing parameter, a RUT that is not a RUT, a malformed date or an inverted range. |
| **403** Forbidden | API Key missing, invalid or unauthorized. | `?key=...` missing, key revoked, or not authorized for the `idAgencia` in the path. |
| **404** Not Found | The resource does not exist in the agency. | Nonexistent `numeroDespacho`, or a RUT that is not an active client of this API. |
| **500** Internal Server Error | Server error. | Retry with back-off; if it persists, report the `requestId`. |

:::info The API responds 403, not 401
Even when the API Key is **missing**, the response is `403` with `code: API_KEY_INVALID`. An earlier version of this documentation declared `401`. It also does not emit `429` or `503`.
:::

See [Errors](./errors.md) for the standard error body format and the application-level code catalog.
