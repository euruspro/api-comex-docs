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

There are two main endpoints, both under the **Documentación** tag in the [API Reference](../reference/api-comex-eurus-pro.info.mdx):

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

Identifies the **document type** within a dispatch. Values currently enabled in the API (note: labels are in Spanish — use them verbatim):

| `fileTypeName` | Description |
|---|---|
| `FACTURA AGENCIA` | Invoice issued by the EURUS PRO agency. |
| `FACTURA TERCEROS` | Invoice issued by third parties (carriers, shipping lines, warehouses, etc.). |
| `NOTA DE COBRO` | Collection note associated with the dispatch. |
| `CERTIFICADO DE ORIGEN` | Certificate of origin of the goods. |
| `CONOCIMIENTO DE EMBARQUE (B/L)` | Bill of Lading. |

:::note
New `fileTypeName` values will be enabled in the API as coverage expands. New values will be announced in the [Changelog](../changelog.md).
:::

:::warning URL encoding required
`fileTypeName` values contain **spaces** and in some cases **parentheses and slashes**. They must be sent **URL-encoded** in the query string:

| Value | URL-encoded |
|---|---|
| `FACTURA AGENCIA` | `FACTURA%20AGENCIA` |
| `FACTURA TERCEROS` | `FACTURA%20TERCEROS` |
| `NOTA DE COBRO` | `NOTA%20DE%20COBRO` |
| `CERTIFICADO DE ORIGEN` | `CERTIFICADO%20DE%20ORIGEN` |
| `CONOCIMIENTO DE EMBARQUE (B/L)` | `CONOCIMIENTO%20DE%20EMBARQUE%20%28B%2FL%29` |

If you build the URL with helpers like `URLSearchParams` (JS), `params={}` (`httpx` / `requests` in Python) or `-d --data-urlencode` (cURL), **the encoding is done automatically** and you don't have to worry about it. The problem only appears if you concatenate raw strings.
:::

## Common use cases

### 1. Download all documents for a known dispatch

If your ERP registers a dispatch and wants to attach all its documents:

```bash
curl "https://api-comex.eurus.pro/12345/v1/dispatch/files/DSP-2026-00123?key=$API_KEY&rut=765432101"
```

### 2. Pull all agency invoices of a month for accounting reconciliation

For a monthly batch process — note the `%20` in place of the space:

```bash
curl "https://api-comex.eurus.pro/12345/v1/dispatch/files?key=$API_KEY&rut=765432101&startDate=2026-01-01&endDate=2026-01-31&fileTypeName=FACTURA%20AGENCIA"
```

Or, equivalently and more readable, using cURL's `--data-urlencode`:

```bash
curl -G "https://api-comex.eurus.pro/12345/v1/dispatch/files" \
  --data-urlencode "key=$API_KEY" \
  --data-urlencode "rut=765432101" \
  --data-urlencode "startDate=2026-01-01" \
  --data-urlencode "endDate=2026-01-31" \
  --data-urlencode "fileTypeName=FACTURA AGENCIA"
```

Check the [API Reference](../reference/api-comex-eurus-pro.info.mdx) to see all parameters, response schemas and interactive examples.
