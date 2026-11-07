---
id: changelog
title: Changelog
sidebar_position: 99
slug: /changelog
description: History of changes to the Comex API and its documentation.
---

# Changelog

All notable changes to the Comex API and its documentation are recorded here. This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added — `GET /dispatch/{numeroDespacho}` (spec 3.2.0)

Returns the data of a dispatch: customs office, vessel, consignor, CIF and FOB values, and its dates. It is the same object that files and disbursements carry in `dispatch`, now available without querying either of them.

Same access rules as the other dispatch resources: `rut` is required, and the dispatch must belong to that account; otherwise, `404 DISPATCH_NOT_FOUND`. See [Tracking](./seguimiento/index.md#status-and-data-of-a-dispatch).

### Changed — `recordType` on `GET /dispatch/status` (spec 3.1.0)

The filter accepts both vocabularies and rejects what it does not understand:

| Value | Before | Now |
|---|---|---|
| `din`, `dus` | Filters | Filters (unchanged) |
| `impo`, `expo` | `200` with an empty list | Filters as `din` / `dus` |
| `DIN`, `Expo` | `200` with an empty list | Filters: case-insensitive |
| `smda` or any other value | `200` with an empty list | **`400 RECORD_TYPE_INVALID`** |

**What to do:** if your integration sent `smda` or an unrecognized value, it got an empty list that matched no data. It now gets a `400`: fix the value or omit the parameter.

`smda` is not a dispatch type: an SMDA (customs dispatch amendment request, *Solicitud de Modificación al Despacho Aduanero*) is always linked to a dispatch, but it is a different document.

### Deprecated — The previous dispatch routes are retired on 2027-03-01

`GET /dispatch/files/{numeroDespacho}`, `GET /dispatch/files` and `GET /dispatch/status/{numeroDespacho}` **stop being available on March 1, 2027, at 00:00 (Chile time)**. From that date they respond `404`. Until then they work exactly as today.

| Retired | Use instead |
|---|---|
| `GET /dispatch/files/{numeroDespacho}` | `GET /dispatch/{numeroDespacho}/files` |
| `GET /dispatch/files` | `GET /files` |
| `GET /dispatch/status/{numeroDespacho}` | `GET /dispatch/{numeroDespacho}/status` |

`GET /dispatch/status` (the listing) is **not** retired.

Migrating is a change of route: parameters, responses and errors are the same. In the meantime, every response from a route being retired announces it in its headers, including the endpoint's own errors (`400`, `404`, `500`). An authentication `403` does not carry them: it is answered before reaching the route.

```http
Deprecation: @1790564400
Sunset: Mon, 01 Mar 2027 03:00:00 GMT
Link: </z_cl_demo/v1/dispatch/123457/files>; rel="successor-version"
```

- `Sunset` ([RFC 8594](https://www.rfc-editor.org/rfc/rfc8594)) is the retirement date, in GMT: 03:00 GMT is 00:00 in Chile.
- `Link` with `rel="successor-version"` points to the route that replaces it.
- `Deprecation` ([RFC 9745](https://www.rfc-editor.org/rfc/rfc9745)) is the date since which the route is deprecated.

To find calls still pending migration, log the responses that carry `Sunset` in your client.

### Fixed — The `500` no longer exposes data-layer details (spec 3.0.1)

On `GET /dispatch/{numeroDespacho}/files`, `GET /files`, `GET /dispatch/{numeroDespacho}/status` and `GET /dispatch/status`, the `500` returned the data layer's `code` and `message`: a numeric `code` —which broke the contract's `code: string`— and, on a missing index, a message carrying an internal URL. It is now always `INTERNAL_ERROR` with a generic message, as on `/dispatch/{numeroDespacho}/desembolsos` and `/master/file-types`. The detail stays in the service logs, and the `requestId` is what links the two when you report it.

If your integration branched on the `code` of a `500`, treat any `500` other than `TENANT_UNRESOLVED` as `INTERNAL_ERROR`: retry with back-off.

### Changed — Dispatch and file routes (spec 3.0.0)

**The previous routes keep working until 2027-03-01**, when they are retired: see *Deprecated* above. The spec no longer declares them.

| Before | Now |
|---|---|
| `GET /dispatch/files/{numeroDespacho}` | `GET /dispatch/{numeroDespacho}/files` |
| `GET /dispatch/status/{numeroDespacho}` | `GET /dispatch/{numeroDespacho}/status` |
| `GET /dispatch/files` | `GET /files` |
| `GET /dispatch/status` | unchanged |

Parameters, responses and errors do not change: it is the same endpoint on another route.

**Why.** A dispatch's resources now hang from the dispatch —`/dispatch/{numeroDespacho}/<resource>`, like the new `/desembolsos`—. Mixing that shape with the previous one meant the same URL could be read two ways. `/files` leaves `/dispatch` because it returns the client's files, which span all their dispatches.

The major version is about the spec, not the service: a client generated from 3.0.0 does not carry the methods of the previous routes.

### Added — `GET /dispatch/{numeroDespacho}/desembolsos`

New endpoint returning **every disbursement** of a dispatch: the expenses the agency paid on the client's behalf, with their status, amounts and supporting documents. New [Disbursements](./desembolsos/index.md) module.

- Same access as `GET /dispatch/{numeroDespacho}/files`: `rut` is required and the dispatch must belong to that account. One of another client answers `404`, the same as a nonexistent one.
- Answers `{ date, total, data }`, with no pagination. `data` comes in chronological order by `fechaDesembolso`.
- Each element carries its dispatch in `dispatch`, with customs inspection and DIN statuses, customs-cycle dates and CIF, FOB, freight and insurance values.
- **Its own presence criterion**: optional fields are omitted, required text fields come as `""`, and required dates and amounts as `null`, never `0`.
- The `500` is always `INTERNAL_ERROR`: data-layer details are not exposed.

### Changed — `dispatch` on the file endpoints

On both file endpoints, `dispatch` goes from `{ id, referencia }` to the full dispatch data: the same contract [Disbursements](./desembolsos/index.md) uses, plus `id`.

- **It is additive**: `id` and `referencia` are still there.
- **It can no longer come back empty.** `dispatch` always carries all its keys, with `""` for text and `null` for dates and amounts. It is the only part of the file the empty-key stripping does not apply to. If your code treated `dispatch: {}` as "no dispatch", it now has to look at `dispatch.id`.
- **`GET /files` now emits `dispatch.referencia`.** It used not to read the dispatch, so the property never appeared. Each file carries its own dispatch, since a page can mix several.

### Added — `GET /master/file-types`

New endpoint returning the agency's **active document types**: the values accepted by the `fileTypeName` parameter of `GET /dispatch/files`.

- Optional `recordType` parameter: `impo` (imports), `expo` (exports), or omitted (both). Case-insensitive; any other value returns `400 RECORD_TYPE_INVALID`.
- No `rut` required: the master list belongs to the agency, not to an end client.
- No pagination: the full catalog comes back in one response, with no `nextToken`.
- **It does not strip valueless keys**, unlike the document endpoints: `name`, `tipoOperacion` and `responsableDoc` come back as `null` when unset, so every element has the same shape. Same criterion as `/dispatch/status`.
- Cacheable response: it is the only endpoint that emits `Cache-Control` (`private, max-age=60`). A newly enabled document type may take up to a minute to appear if your HTTP client honours the header.
- The documented field sizes (`name` 64, `tipoOperacion` 3, `responsableDoc` 32, `id` 120) are **suggested**: they help you size your columns, and the API does not truncate a value that exceeds them.

As a result, the `fileTypeName` table in the [Documentation](./documentacion/index.md) guide becomes a reference only: the live list is now available over the API.

### Changed — Account-scoped authorization and new tracking endpoints

**Behaviour change in production.** `rut` goes from a declared parameter to an enforced control, and the portal documents `/dispatch/status` for the first time.

#### `rut` now scopes what the API returns

| Endpoint | Before | Now |
|---|---|---|
| `GET /dispatch/files/{n}` | `rut` declared required, **not validated** | Enforced; the dispatch must belong to that account |
| `GET /dispatch/status/{n}` | did not ask for `rut` | Enforced; the dispatch must belong to that account |
| `GET /dispatch/status` | did not ask for `rut`, returned all | Enforced; filters by account |

A dispatch that does not exist and one that exists but belongs to another client return the **same** `404 DISPATCH_NOT_FOUND`. That is deliberate: if they differed, walking correlative numbers would reveal which dispatches exist in the agency without accessing any of them.

#### Documented for the first time: `/dispatch/status`

Two endpoints that already existed and the portal did not describe: a dispatch's detail, and the listing of those in your account, with `recordType` and `isCompleted` filters, ordering and `limit`.

Their contract **differs** from the documents one in two ways worth not confusing:

- **Every key is always present**; empty ones are emitted as `null` instead of disappearing.
- **There is no cursor pagination.** It is bounded by `limit` (200 max), and `total` is how many were returned, not how many exist.

#### An invalid `nextToken` goes from silence to `400`

A `nextToken` that does not match an existing document now returns `400 NEXT_TOKEN_INVALID`. It used to be ignored, returning the first page, which made a long walk **restart and reprocess what it had already processed**, duplicating data with no signal.

#### `TENANT_UNRESOLVED`: new code, and no longer a `400`

When the agency's configuration cannot be resolved, the response goes from `400 PROJECT_ID_UNDEFINED` to **`500 TENANT_UNRESOLVED`**. A `4xx` blamed the integrator for a configuration failure that is ours, and meant neither their monitoring nor ours treated it as an incident. Retrying does not fix it: report the `requestId`.

#### Dates and references in the response

Timestamps are always emitted as ISO 8601 with zone, and references to other documents as their identifier, never as an internal path. On `/dispatch/status` the dates came out raw (`{"_seconds":…,"_nanoseconds":…}`); that was a defect.

### Changed — The published contract now reflects the real API

This release fixes a wide divergence between what the portal documented and what the API returns. **If you already integrated against the previous documentation, read this section: several fields the spec declared do not exist.**

#### `GET /dispatch/files` response (both variants)

| Field documented before | Actual state |
|---|---|
| `fileName` | **Does not exist.** |
| `fileTypeName` (in the response) | **Does not exist.** The document type comes in `name`. |
| `dispatchNumber` | **Does not exist.** The number comes in `numeroDespacho`. |
| `issuedAt` | **Does not exist.** The issue date, when present, is in `infoDoc.document.issueDate`, with no guaranteed format. |
| `total` (envelope) | **Does not exist.** Pagination is cursor-based. |

Real fields the spec did not declare: `id`, `isActive`, `dispatch`, `infoDoc`, and in the envelope `date`, `nextToken` and `unsignedCount`.

#### Field presence

Documented for the first time: the API **removes from the JSON every property whose value is `null`, `undefined` or `""`**. Only `id`, `isActive`, `dispatch` and `infoDoc` are guaranteed; the rest may be missing on one element and present on the next in the same response. Includes the warning about `{}` being truthy.

#### Pagination

The note claiming there was no pagination is gone. It is **cursor-based**, with a fixed limit of **100** per page: `nextToken` appears only if the page returned exactly 100 elements. Two behaviours you must tolerate are documented: the last page may come back empty, and an invalid `nextToken` is **silently ignored**, returning the first page.

#### Errors

The previous catalog (`INVALID_ARGUMENT`, `UNAUTHENTICATED`, `RATE_LIMITED`, `BUSINESS_RULE_VIOLATION` and eight others) **matched no code the API actually emits**. It was replaced with the real catalog: `API_KEY_INVALID`, `PROJECT_ID_UNAUTHORIZED`, `PROJECT_ID_UNDEFINED`, `DISPATCH_ID_INVALID`, `DISPATCH_NOT_FOUND`, `RUT_NUMBER_INVALID`, `START_DATE_REQUIRED`, `END_DATE_REQUIRED`, `START_DATE_INVALID`, `END_DATE_INVALID`, `DATE_RANGE_INVALID`, `FILE_TYPE_NAME_INVALID`, `ACCOUNT_NOT_FOUND` and `INTERNAL_ERROR`.

- The error body is `{ status, code, message, requestId }`. **There is no `details`.**
- **The API responds `403`, not `401`**, even when the API Key is missing.
- **It does not emit `408`, `409`, `422`, `429`, `502`, `503` or `504`.**

#### Rate limits

The published figures (60 req/min, 10,000 req/day) and the `X-RateLimit-*` headers are withdrawn: **the gateway declares no quota** for these endpoints and the API does not emit `429`. When quotas are defined they will be announced here before taking effect.

#### Dates and RUT

- `startDate` and `endDate` are interpreted in **`America/Santiago`**, not UTC, and accept `YYYY-MM-DD HH:mm` in addition to `YYYY-MM-DD`. With no time, the range covers the full day (`00:00:00.000` to `23:59:59.999`).
- `rut` no longer requires the canonical form: `999999999`, `99999999-9`, `99.999.999-9` and the `K` check digit are all accepted. What gets rejected is documented, and why a well-formed RUT that is not a client returns `404`, not `400`.

#### Other

- `idAgencia` is no longer described as numeric: it is an opaque string.
- Examples use the fictional tenant (`z_cl_demo`, dispatch `123457`, RUT `999999999`) instead of real-looking values.
- The spec states explicitly that it describes **backend behaviour**, not gateway configuration.

### Added

- **Download URL** (`url`) on each document: signed, valid for **1 hour**. It may be missing for two different reasons — the document has no file, or its URL could not be signed — and the second case is counted in `unsignedCount`.
- **`requestId`** guaranteed in every error body and in the `X-Request-Id` header of every response. Documented that an inbound `X-Request-Id` is honoured, with its length and alphabet limits.
- **CI** ([`ci.yml`](https://github.com/euruspro/api-comex-docs/blob/main/.github/workflows/ci.yml)): every PR against `main` is validated — OpenAPI spec lint with Redocly, `type-check`, and a build of both locales.
- **Spec validation** with Redocly (`redocly.yaml`), including checking that examples validate against their own schema.

### Fixed

- The deploy workflow filtered `'**.md'` in `paths-ignore`, so **no documentation change was ever published**. The filter was removed and CI was separated from CD.
- `onBrokenLinks` and `onBrokenMarkdownLinks` went from `warn` to `throw`: a broken internal link now stops the build instead of shipping.
- `DispatchFile.issuedAt` used `nullable: true`, OpenAPI 3.0 syntax that is invalid in 3.1 (the spec declares `openapi: 3.1.0`). The field was removed along with the rest of the fictional schema.

### To be defined

- **Imports** module endpoints.
- **Exports** module endpoints.
- Professional English translation.
- Official EURUS PRO® branding.
- Sandbox environment with test credentials.
- Official Postman collection.
- Usage quotas, if defined.

---

## [0.1.0] — 2026-04-10

### Added — Initial release of the documentation portal

- Initial scaffolding of the public documentation site with [Docusaurus 3](https://docusaurus.io/) and the [`docusaurus-plugin-openapi-docs`](https://github.com/PaloAltoNetworks/docusaurus-openapi-docs) plugin for interactive reference.
- Bilingual support: **Spanish (default)** and **English** via i18n.
- **3 functional modules** structured in the navigation:
  - **Imports** (coming soon)
  - **Exports** (coming soon)
  - **Documentation** (available)
- **Getting started** section: Introduction, Quickstart, Authentication.
- **Technical guides** section: Conventions, Errors, Webhooks.
- **2 real endpoints** documented in the Documentation module:
  - `GET /{idAgencia}/v1/dispatch/files/{numeroDespacho}` — documents of a dispatch (with optional `fileTypeName` filter).
  - `GET /{idAgencia}/v1/dispatch/files` — documents by type and date range.
- **Production base URL**: `https://api-comex.eurus.pro/{idAgencia}/v1`.
- Authentication documented via **API Key in query parameter** (`?key=<API_KEY>`), consistent with the API gateway.
- Documentation of the **RUT format** required by the API (digits only, K → 1).
- Code examples in **cURL, Node.js and Python** for every call, including RUT-normalization helpers.
- GitHub Actions workflow for **automatic deploy to GitHub Pages** with the custom domain `api-comex-docs.eurus.pro`.
- **EURUS PRO® branding** applied: corporate palette (`#004ea3`, `#00bee3`, `#001a5d`, `#001833`, `#f2f3f5`) in light/dark mode, repository logo as a placeholder SVG based on the 2024 Brand Book, favicon with the corporate blue gradient.
- Real **`fileTypeName`** values documented in the OpenAPI spec and on the Documentation module page:
  - `FACTURA AGENCIA`
  - `FACTURA TERCEROS`
  - `NOTA DE COBRO`
  - `CERTIFICADO DE ORIGEN`
  - `CONOCIMIENTO DE EMBARQUE (B/L)`
- Explicit warning about **URL encoding** of `fileTypeName` (values contain spaces, parentheses and slashes), with a conversion table and a `cURL --data-urlencode` example.
