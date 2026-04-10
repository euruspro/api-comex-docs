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

### Planned

- **Imports** module endpoints.
- **Exports** module endpoints.
- Professional English translation.
- Official EURUS PRO branding applied.
- Sandbox environment with test credentials.
- Official Postman collection.
- Pagination on listing endpoints when volumes warrant it.

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
