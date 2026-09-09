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

The published figures (60 req/min, 10,000 req/day) and the `X-RateLimit-*` headers are withdrawn: **the API Gateway declares no quota** for these endpoints and the API does not emit `429`. When quotas are defined they will be announced here before taking effect.

#### Dates and RUT

- `startDate` and `endDate` are interpreted in **`America/Santiago`**, not UTC, and accept `YYYY-MM-DD HH:mm` in addition to `YYYY-MM-DD`. With no time, the range covers the full day (`00:00:00.000` to `23:59:59.999`).
- `rut` no longer requires the canonical form: `999999999`, `99999999-9`, `99.999.999-9` and the `K` check digit are all accepted. What gets rejected is documented, and why a well-formed RUT that is not a client returns `404`, not `400`.

#### Other

- `idAgencia` is no longer described as numeric: it is an opaque string.
- Examples use the fictional tenant (`z_cl_demo`, dispatch `123457`, RUT `999999999`) instead of real-looking values.
- The spec states explicitly that it describes **backend behaviour**, not API Gateway configuration.

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
- Official EURUS PRO branding.
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
- Authentication documented via **API Key in query parameter** (`?key=<API_KEY>`), consistent with Google Cloud API Gateway.
- Documentation of the **RUT format** required by the API (digits only, K → 1).
- Code examples in **cURL, Node.js and Python** for every call, including RUT-normalization helpers.
- GitHub Actions workflow for **automatic deploy to GitHub Pages** with the custom domain `api-comex-docs.eurus.pro`.
- **EURUS PRO branding** applied: corporate palette (`#004ea3`, `#00bee3`, `#001a5d`, `#001833`, `#f2f3f5`) in light/dark mode, repository logo as a placeholder SVG based on the 2024 Brand Book, favicon with the corporate blue gradient.
- Real **`fileTypeName`** values documented in the OpenAPI spec and on the Documentation module page:
  - `FACTURA AGENCIA`
  - `FACTURA TERCEROS`
  - `NOTA DE COBRO`
  - `CERTIFICADO DE ORIGEN`
  - `CONOCIMIENTO DE EMBARQUE (B/L)`
- Explicit warning about **URL encoding** of `fileTypeName` (values contain spaces, parentheses and slashes), with a conversion table and a `cURL --data-urlencode` example.
