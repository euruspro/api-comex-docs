---
id: index
title: Disbursements
slug: /desembolsos
description: Disbursements module — expenses paid by the agency on the client's behalf, per dispatch.
---

# Disbursements

The **Disbursements** (*Desembolsos*) module returns the expenses the agency paid on the client's behalf for a dispatch —freight, storage, duties, third-party services—, with their status, amounts and supporting documents.

## Available endpoint

Under the **Desembolsos** tag of the [API Reference](../reference/api-comex-eurus-pro.info.mdx):

**[`GET /dispatch/{numeroDespacho}/desembolsos`](../reference/listar-desembolsos-despacho.api.mdx)**
Every disbursement of a **specific dispatch** of the client.

```bash
curl "https://api-comex.eurus.pro/$EURUS_AGENCIA/v1/dispatch/123457/desembolsos?key=$EURUS_API_KEY&rut=$EURUS_RUT"
```

## Parameters

| Parameter | Location | Description |
|---|---|---|
| `idAgencia` | Path (server variable) | Your EURUS PRO® agency identifier. |
| `numeroDespacho` | Path | Dispatch number. |
| `key` | Query | API Key provided by EURUS PRO®. See [Authentication](../authentication.md). |
| `rut` | Query | End client RUT (see [RUT format](../conventions.md#rut-format)). **It scopes what you see**: the dispatch must belong to that account. |

A dispatch belonging to another client answers `404`, the same as a nonexistent one. See [Errors](../errors.md).

## Three presence rules

This module has its own criterion for missing data, different from Documentation (which strips empty keys) and from Tracking (which emits everything as `null`).

### 1. Optional fields are omitted

The amounts (`debe`, `monto`, `montoIva`, `montoNeto`, `saldo`), `fechaFacturado`, `invoiceInfo` and `documentInfo` are **absent** when there is no data.

:::warning A missing amount is not zero
Check that the key exists before adding. Treating a missing `monto` as `0` understates the total with no signal at all.

```javascript
const totalPaid = data
  .filter((d) => typeof d.monto === 'number')
  .reduce((acc, d) => acc + d.monto, 0);
```
:::

### 2. Required text fields come as `""`

`codigoAnalisis`, `numeroDespacho`, `nombreAnalisis`, `numeroDocumento` and `estado` are **always** present. Without data they come as `""`.

### 3. Required dates and amounts come as `null`

`fechaDesembolso` and, inside `dispatch`, every date and amount are always present, and `null` when there is no data. Never `0` or `""`: a `valorCif: 0` would be mistaken for a real value.

## The dispatch in each element

Each disbursement carries its dispatch in `dispatch`: customs inspection and DIN statuses, customs-cycle dates (acceptance, arrival, release, duty payment) and values (CIF, FOB, freight, insurance). It is the same object in every element of the response.

## Order and volume

- **Chronological order** by `fechaDesembolso`. Undated records go last.
- **No pagination**: the response carries every disbursement of the dispatch, and `total` is their count.

## Supporting documents

`invoiceInfo` (the invoice) and `documentInfo` (another voucher) share the same shape. Their text fields are omitted without data, but `totals` is **always** present, even if empty:

```json
"invoiceInfo": {
  "fechaDocumento": "2026-01-15T00:00:00.000Z",
  "idProveedor": "76501137-K",
  "name": "FACTURA",
  "nombreProveedor": "NAVIERA DEMO SPA",
  "totals": { "neto": 1000, "iva": 190, "total": 1190 }
}
```

The keys of `totals` depend on the document: do not assume a fixed set.
