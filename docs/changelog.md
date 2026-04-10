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

- Endpoints del módulo de **Importaciones**.
- Endpoints del módulo de **Exportaciones**.
- Traducción profesional al inglés.
- Aplicación del branding oficial de EURUS PRO.
- Entorno sandbox con credenciales de prueba.
- Postman collection oficial.
- Paginación en endpoints de listado cuando los volúmenes lo justifiquen.

---

## [0.1.0] — 2026-04-10

### Added — Publicación inicial del portal de documentación

- Scaffolding inicial del centro de documentación pública con [Docusaurus 3](https://docusaurus.io/) y el plugin [`docusaurus-plugin-openapi-docs`](https://github.com/PaloAltoNetworks/docusaurus-openapi-docs) para referencia interactiva.
- Soporte bilingüe **español (default)** e **inglés** mediante i18n.
- **3 módulos funcionales** estructurados en la navegación:
  - **Importaciones** (próximamente)
  - **Exportaciones** (próximamente)
  - **Documentación** (disponible)
- Sección **Primeros pasos**: Introducción, Quickstart, Autenticación.
- Sección **Guías técnicas**: Convenciones, Errores, Webhooks.
- **2 endpoints reales** documentados en el módulo de Documentación:
  - `GET /{idAgencia}/v1/dispatch/files/{numeroDespacho}` — documentos de un despacho (con filtro opcional por `fileTypeName`).
  - `GET /{idAgencia}/v1/dispatch/files` — documentos por tipo y rango de fechas.
- **Base URL de producción**: `https://api-comex.eurus.pro/{idAgencia}/v1`.
- Autenticación documentada vía **API Key en query parameter** (`?key=<API_KEY>`), consistente con Google Cloud API Gateway.
- Documentación del **formato de RUT** exigido por la API (solo dígitos, K → 1).
- Ejemplos de código en **cURL, Node.js y Python** para cada llamada, incluyendo helpers de normalización de RUT.
- Workflow de GitHub Actions para **deploy automático a GitHub Pages** con dominio personalizado `docs.eurus.pro`.
