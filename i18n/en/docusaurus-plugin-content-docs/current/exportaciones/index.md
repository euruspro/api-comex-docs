---
id: index
title: Exports
slug: /exportaciones
description: Exports module of the EURUS PRO Comex API.
---

# Exports

This module of the Comex API will cover operations and queries related to **export operations** managed by EURUS PRO.

:::info Coming soon
The specific export endpoints will be available in a future iteration of the API. For now, the documents associated with export dispatches are queried through the [Documentation](../documentacion/index.md) module, which supports both imports and exports.
:::

## What you'll be able to do from this module

Once the endpoints are released, from here you'll be able to:

- Register and query export operations.
- Retrieve commercial, logistical and customs details of each shipment.
- Track the lifecycle of a dispatch (draft → registered → in process → shipped → closed).
- Subscribe to state-change events via [webhooks](../webhooks.md).

## In the meantime

You can retrieve the **documents associated with an export dispatch** (commercial invoice, packing list, BL, certificate of origin, etc.) using the [Documentation](../documentacion/index.md) module:

- [Query documents of a dispatch](../reference/listar-documentos-despacho.api.mdx)
- [Query documents by type and date range](../reference/listar-documentos-por-tipo-y-fecha.api.mdx)
