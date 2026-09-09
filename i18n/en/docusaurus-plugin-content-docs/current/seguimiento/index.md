---
id: index
title: Tracking
slug: /seguimiento
description: Tracking module — status and traceability of foreign trade dispatches.
---

# Tracking

The **Tracking** module lets you query the status of foreign trade dispatches: record type, DIN or DUS status, relevant dates and priority.

It covers both **imports** and **exports**: the `recordType` field distinguishes the operation type.

## Available endpoints

Both under the **Seguimiento** tag in the [API Reference](../reference/api-comex-eurus-pro.info.mdx):

1. **[`GET /dispatch/status/{numeroDespacho}`](../reference/consultar-estado-despacho.api.mdx)**
   Status of a **specific dispatch**.

2. **[`GET /dispatch/status`](../reference/listar-estados-despacho.api.mdx)**
   **All dispatches in your account**, with filters by record type and completion, ordering and a limit.

## Three differences from the Documentation module

Both modules share authentication and the `rut` parameter, but their response contract differs in three ways worth not confusing.

### 1. Every key is always present

In Documentation, an empty field **disappears** from the JSON. Here it is the opposite: the response always carries all thirteen keys, and those with no value are emitted as `null`.

```json
{
  "id": "123457",
  "numeroDespacho": "123457",
  "recordType": "din",
  "EstadoDIN": "ACEPTADA",
  "EstadoDUS": null,
  "isCompleted": false,
  "dueStatus": "EN_PLAZO",
  "priority": "ALTA",
  "allowEdit": true,
  "createdDate": "2026-01-05T13:00:00.000Z",
  "lastModifiedDate": "2026-01-18T09:10:00.000Z",
  "fechaEta": "2026-01-22T00:00:00.000Z",
  "fechaLegalizacion": null
}
```

### 2. There is no cursor pagination

The listing is bounded by `limit`, which accepts up to **200** and defaults to 50. There is no `nextToken`.

:::warning `total` is not how many exist
`total` is **how many came back in that response**. If it equals `limit`, there are probably more dispatches than you are seeing: raise the `limit` or narrow the filters.
:::

### 3. Filters tolerate unsupported values, but do not rely on it

The supported values are the ones declared in the [API Reference](../reference/api-comex-eurus-pro.info.mdx): `orderBy` within its list, `orderDirection` as `asc` or `desc`, and `limit` between 1 and 200.

Today a value outside that range does not produce an error: it is discarded and the default applies. **That behaviour is not part of the contract** and may start returning `400` without prior notice, so validate the filters on your side instead of relying on the silent fallback.

## Common parameters

| Parameter | Location | Description |
|---|---|---|
| `idAgencia` | Path (server variable) | Your EURUS PRO agency identifier. |
| `key` | Query | API Key provided by EURUS PRO. See [Authentication](../authentication.md). |
| `rut` | Query | End client RUT (see [RUT format](../conventions.md#rut-format)). **It scopes what you see**: only dispatches belonging to that account are returned. |

A dispatch belonging to another client returns `404`, just like a nonexistent one. See [Errors](../errors.md).
