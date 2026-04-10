---
id: changelog
title: Changelog
sidebar_position: 99
slug: /changelog
description: Historial de cambios de la API Comex y de esta documentación.
---

# Changelog

Todos los cambios notables en la API Comex y en su documentación se registran aquí. Este proyecto sigue [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) y [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Por definir

- Documentación completa de todos los endpoints reales.
- Traducción profesional al inglés.
- Aplicación del branding oficial de EURUS PRO.
- Entorno sandbox con credenciales de prueba.
- Postman collection oficial.

---

## [0.1.0] — 2026-04-10

### Added — Publicación inicial del portal de documentación

- Scaffolding inicial del centro de documentación pública con [Docusaurus 3](https://docusaurus.io/).
- Soporte bilingüe **español (default)** e **inglés** mediante i18n.
- Sección **Primeros pasos**: Introducción, Quickstart, Autenticación.
- Sección **Guías técnicas**: Convenciones, Webhooks, Errores.
- **Referencia interactiva de la API** generada desde `openapi/comex.yaml` con consola "Try it" integrada.
- 2 endpoints placeholder documentados:
  - `POST /v1/exportaciones` — Crear una operación de exportación.
  - `GET /v1/exportaciones/{id}/documentos` — Listar documentos de una exportación.
- Autenticación documentada vía **API Key en query parameter** (`?key=<API_KEY>`), consistente con Google Cloud API Gateway.
- Ejemplos de código en **cURL, Node.js y Python** para cada llamada.
- Workflow de GitHub Actions para **deploy automático a GitHub Pages** con dominio personalizado `docs.euruspro.com`.
