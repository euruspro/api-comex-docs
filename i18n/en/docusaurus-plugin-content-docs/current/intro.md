---
id: intro
title: Introduction
sidebar_position: 1
slug: /intro
description: Overview of the EURUS PRO Comex API, its scope and core concepts.
---

# Comex API — EURUS PRO

Welcome to the public documentation for the **EURUS PRO Comex API**, a REST API that lets external systems integrate with EURUS PRO's **foreign trade** processes: registering export operations, issuing and retrieving commercial documentation, certificates, and tracking.

:::info Audience
This documentation is aimed at **technical teams** integrating a system (ERP, TMS, in-house portal, middleware, internal script) with EURUS PRO services. Basic knowledge of HTTP, JSON and REST API consumption is assumed.
:::

## What you can do with the Comex API

With this API you can, among other things:

- **Register foreign-trade operations** (exports), including commercial data, incoterms, tariff codes and items.
- **Track the status** of an operation through its lifecycle (draft, registered, in process, shipped, closed).
- **Retrieve documents and certificates** associated with an operation: commercial invoice, packing list, Bill of Lading, certificate of origin, phytosanitary certificates, etc.
- **Receive events via webhooks** whenever an operation changes state or a new document is issued.

## Core concepts

| Concept | Description |
|---|---|
| **Operation** | Main unit of the system. Represents an export with its commercial, logistical and documentary data. Has a lifecycle and a status. |
| **Item** | Product line within an operation, with its description, tariff code (HS code), quantity and value. |
| **Document** | Any documentary piece linked to an operation: invoice, packing list, BL, certificate of origin, etc. |
| **Certificate** | A subtype of document issued by an external entity (e.g. certificate of origin, phytosanitary certificate). |
| **Webhook** | An HTTP POST notification that EURUS PRO sends to your system when a relevant event occurs. |

## Technical architecture

The Comex API is exposed through **Google Cloud API Gateway**, which has a couple of important implications for your integration:

- **All calls use HTTPS**. Plain HTTP is not accepted.
- **Authentication uses an API Key sent as a query parameter** (`?key=<API_KEY>`), not as an `Authorization` header. This is specific to Google API Gateway. See [Authentication](./authentication.md) for details.
- Endpoints are versioned with the `/v1` prefix.

## Base URL

```
https://api.euruspro.com/comex/v1
```

:::note Placeholder
The URL above is a provisional value published in this version of the docs. It will be confirmed by EURUS PRO before the official launch.
:::

## Next steps

1. Read the [Quickstart guide](./quickstart.md) to make your first call in under 5 minutes.
2. Review the [Authentication](./authentication.md) section to understand how to obtain and manage your API Key.
3. Check the [Conventions](./conventions.md) for request formats, pagination, errors and versioning.
4. Explore the [Endpoint reference](./reference) with interactive examples you can run from the browser.
