---
id: intro
title: Introduction
sidebar_position: 1
slug: /intro
description: Overview of the EURUS PRO Comex API, its scope and core concepts.
---

# Comex API — EURUS PRO

Welcome to the public documentation for the **EURUS PRO Comex API**, a REST API that lets external systems integrate with EURUS PRO's **foreign trade** processes: querying import and export operations, and accessing documents and certificates associated with each dispatch.

:::info Audience
This documentation is aimed at **technical teams** integrating a system (ERP, TMS, in-house portal, middleware, internal script) with EURUS PRO services. Basic knowledge of HTTP, JSON and REST API consumption is assumed.
:::

## API modules

In its initial stage, the Comex API exposes **three functional modules**:

| Module | Description | Status |
|---|---|---|
| **[Imports](./importaciones/index.md)** | Query and management of import operations. | Coming soon |
| **[Exports](./exportaciones/index.md)** | Query and management of export operations. | Coming soon |
| **[Documentation](./documentacion/index.md)** | Query files and documents associated with dispatches (invoices, packing lists, BL, certificates, etc.). | **Available** |

## Core concepts

| Concept | Description |
|---|---|
| **Agency** | EURUS PRO unit that manages its clients' operations. Each agency has a unique `idAgencia` that forms part of every API path. |
| **Client** | End organization (importer/exporter) identified by its **RUT**. Every call requires the `rut` parameter. |
| **Dispatch** | Operational unit that groups the documents of a foreign-trade operation. Identified by a `numeroDespacho`. |
| **Document** | File associated with a dispatch: commercial invoice, packing list, BL, certificate of origin, phytosanitary certificate, etc. Identified by its `fileTypeName`. |

## Technical architecture

The Comex API is exposed through **Google Cloud API Gateway**, which has a couple of important implications for your integration:

- **All calls use HTTPS**. Plain HTTP is not accepted.
- **Authentication uses an API Key sent as a query parameter** (`?key=<API_KEY>`), not as an `Authorization` header. This is specific to Google API Gateway. See [Authentication](./authentication.md) for details.
- **The `idAgencia` is part of the path** (before the `/v1` segment) and is assigned when access is provisioned.
- **The client `rut`** is sent as a query parameter on every call, in digits-only format. See [Conventions → RUT format](./conventions.md#rut-format).

## Base URL

```
https://api-comex.eurus.pro/{idAgencia}/v1
```

The `{idAgencia}` is your agency identifier assigned by EURUS PRO. For example, if your agency ID is `12345`, the real base URL will be:

```
https://api-comex.eurus.pro/12345/v1
```

## Next steps

1. Read the [Quickstart guide](./quickstart.md) to make your first call in under 5 minutes.
2. Review the [Authentication](./authentication.md) section to understand how to obtain and manage your API Key.
3. Check the [Conventions](./conventions.md) for request formats, RUT, pagination and errors.
4. Explore the [Documentation](./documentacion/index.md) module — the only one available in this initial stage — with its 2 interactive endpoints.
