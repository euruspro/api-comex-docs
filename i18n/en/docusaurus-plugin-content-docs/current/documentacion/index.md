---
id: index
title: Documentation
slug: /documentacion
description: Documentation module — query files and documents associated with dispatches.
---

# Documentation

The **Documentation** module lets you query the files and documents associated with foreign-trade dispatches managed by EURUS PRO: **commercial invoices, packing lists, Bill of Lading, certificates of origin, sanitary certificates** and any other document attached to a dispatch.

This module applies to both **imports** and **exports** — the API does not distinguish the operation type in its file-query endpoints.

## Available endpoints

There are two main endpoints, both under the **Documentación** tag in the [API Reference](../reference):

1. **[`GET /dispatch/files/{numeroDespacho}`](../reference/listar-documentos-despacho.api.mdx)**
   Returns **all documents** (or filtered by `fileTypeName`) of a **specific dispatch** of the client.

2. **[`GET /dispatch/files`](../reference/listar-documentos-por-tipo-y-fecha.api.mdx)**
   Returns documents of a **specific type** (`fileTypeName`) issued within a **date range** for a client.

## Common parameters

All endpoints in this module require the following mandatory parameters:

| Parameter | Location | Description |
|---|---|---|
| `idAgencia` | Path (server variable) | Your EURUS PRO agency identifier. Assigned when access is provisioned. |
| `key` | Query | API Key provided by EURUS PRO. See [Authentication](../authentication.md). |
| `rut` | Query | End client RUT, **digits only** (see [RUT format](../conventions.md#rut-format)). |

## Core concepts

### Dispatch

A **dispatch** is the operational unit that groups all documents of a foreign-trade operation. Each dispatch has a **number** (`numeroDespacho`) assigned by EURUS PRO at creation time.

### `fileTypeName`

Identifies the **document type** within a dispatch. Some typical values:

| `fileTypeName` | Description |
|---|---|
| `FACTURA` | Commercial invoice. |
| `PACKING_LIST` | Packing list. |
| `BILL_OF_LADING` | Bill of Lading. |
| `CERTIFICADO_ORIGEN` | Certificate of origin. |
| `CERTIFICADO_FITOSANITARIO` | Phytosanitary certificate. |

:::note
The full list of supported `fileTypeName` values depends on your agency's configuration. Check with EURUS PRO for the exact values enabled for your account.
:::

## Common use cases

### 1. Download all documents for a known dispatch

If your ERP registers a dispatch and wants to attach all its documents:

```bash
curl "https://api-comex.eurus.pro/12345/v1/dispatch/files/DSP-2026-00123?key=$API_KEY&rut=765432101"
```

### 2. Pull all invoices of a month for accounting reconciliation

For a monthly batch process:

```bash
curl "https://api-comex.eurus.pro/12345/v1/dispatch/files?key=$API_KEY&rut=765432101&startDate=2026-01-01&endDate=2026-01-31&fileTypeName=FACTURA"
```

Check the [API Reference](../reference) to see all parameters, response schemas and interactive examples.
