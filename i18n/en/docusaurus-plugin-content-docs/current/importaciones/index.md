---
id: index
title: Imports
slug: /importaciones
description: Imports module of the EURUS PRO Comex API.
---

# Imports

This module of the Comex API will cover operations and queries related to **import operations** managed by EURUS PRO.

:::info Coming soon
The specific import endpoints will be available in a future iteration of the API. For now, the documents associated with import dispatches are queried through the [Documentation](../documentacion/index.md) module, which supports both imports and exports.
:::

## What you'll be able to do from this module

Once the endpoints are released, from here you'll be able to:

- Query the status of import operations.
- Retrieve commercial, logistical and customs details of each operation.
- Track the lifecycle of a dispatch (registered → in process → cleared → delivered → closed).
- Subscribe to state-change events via [webhooks](../webhooks.md).

## In the meantime

You can retrieve the **documents associated with an import dispatch** using the [Documentation](../documentacion/index.md) module:

- [Query documents of a dispatch](../reference/listar-documentos-despacho.api.mdx)
- [Query documents by type and date range](../reference/listar-documentos-por-tipo-y-fecha.api.mdx)
