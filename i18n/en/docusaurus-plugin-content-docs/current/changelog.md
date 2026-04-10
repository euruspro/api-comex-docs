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

- Full documentation of all real endpoints.
- Professional English translation.
- Official EURUS PRO branding applied.
- Sandbox environment with test credentials.
- Official Postman collection.

---

## [0.1.0] — 2026-04-10

### Added — Initial release of the documentation portal

- Initial scaffolding of the public documentation site with [Docusaurus 3](https://docusaurus.io/).
- Bilingual support: **Spanish (default)** and **English** via i18n.
- **Getting started** section: Introduction, Quickstart, Authentication.
- **Technical guides** section: Conventions, Webhooks, Errors.
- **Interactive API reference** generated from `openapi/comex.yaml` with an integrated "Try it" console.
- 2 placeholder endpoints documented:
  - `POST /v1/exportaciones` — Create an export operation.
  - `GET /v1/exportaciones/{id}/documentos` — List documents of an export.
- Authentication documented via **API Key in query parameter** (`?key=<API_KEY>`), consistent with Google Cloud API Gateway.
- Code examples in **cURL, Node.js and Python** for every call.
- GitHub Actions workflow for **automatic deploy to GitHub Pages** with the custom domain `docs.euruspro.com`.
