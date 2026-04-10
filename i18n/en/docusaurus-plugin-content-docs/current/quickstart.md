---
id: quickstart
title: Quickstart
sidebar_position: 2
slug: /quickstart
description: Make your first call to the Comex API in under 5 minutes, with cURL, Node.js and Python examples.
---

# Quickstart

This guide takes you from zero to a successful call to the **EURUS PRO Comex API** in under five minutes. By the end you'll have an authenticated request working from your terminal or a script.

## Prerequisites

To make your first call you need **three pieces of data** that must be provided by EURUS PRO:

| Data | Description | Example |
|---|---|---|
| **`idAgencia`** | Your EURUS PRO agency numeric ID. | `12345` |
| **`key`** | Secret API Key to authenticate calls. | `AIzaSy...` |
| **`rut`** | End client RUT, in **digits-only** format (see [RUT format](./conventions.md#rut-format)). | `765432101` |

In addition you need:

- A tool to make HTTP requests. We'll use **cURL**, **Node.js** (with native `fetch`, Node ≥ 18) and **Python 3** (with `httpx` or `requests`).
- A valid **`numeroDespacho`** of the client you'll test with.
- Network access to `https://api-comex.eurus.pro`.

## Step 1 — Get credentials

Contact the EURUS PRO team to request API access:

1. Email [api@eurus.pro](mailto:api@eurus.pro) with your organization's name, intended use, and the public IP address from which you will consume the API (optional, to restrict the key).
2. You'll receive:
   - Your assigned **`idAgencia`**.
   - A unique, secret **API Key**.
3. **Store it safely** (secret manager, environment variables, vault). Never commit it to a public repository.

:::warning API Key security
The API Key identifies your organization to the Comex API. Treat it like a password: never share it, never publish it, and rotate it if you suspect a leak. See [Authentication → Best practices](./authentication.md#best-practices).
:::

## Step 2 — Make your first call

Let's list the documents associated with a known dispatch. The URL follows this pattern:

```
GET https://api-comex.eurus.pro/{idAgencia}/v1/dispatch/files/{numeroDespacho}?key=<API_KEY>&rut=<RUT>
```

Replace `{idAgencia}`, `<API_KEY>`, `{numeroDespacho}` and `<RUT>` with your real values.

:::tip RUT format
The `rut` parameter must be sent **digits only**, with no dots, no dashes and no verifier letter. If the RUT ends in "K", replace the K with "1".

- `76.543.210-K` → `765432101`
- `12.345.678-9` → `123456789`
:::

### cURL

```bash
export EURUS_API_KEY="your-api-key-here"
export EURUS_AGENCIA="12345"
export EURUS_RUT="765432101"

curl -X GET \
  "https://api-comex.eurus.pro/$EURUS_AGENCIA/v1/dispatch/files/DSP-2026-00123?key=$EURUS_API_KEY&rut=$EURUS_RUT" \
  -H "Accept: application/json"
```

### Node.js (Node ≥ 18, native `fetch`)

```javascript
const API_KEY = process.env.EURUS_API_KEY;
const AGENCIA = process.env.EURUS_AGENCIA;       // e.g. "12345"
const RUT = process.env.EURUS_RUT;               // e.g. "765432101"
const numeroDespacho = "DSP-2026-00123";

const url = new URL(
  `https://api-comex.eurus.pro/${AGENCIA}/v1/dispatch/files/${encodeURIComponent(numeroDespacho)}`
);
url.searchParams.set("key", API_KEY);
url.searchParams.set("rut", RUT);

const response = await fetch(url, {
  headers: { "Accept": "application/json" },
});

if (!response.ok) {
  throw new Error(`Error ${response.status}: ${await response.text()}`);
}

const { data, total } = await response.json();
console.log(`${total} documents found`);
for (const doc of data) {
  console.log(`- ${doc.fileTypeName}: ${doc.url}`);
}
```

### Python 3 (`httpx`)

```python
import os
import httpx

API_KEY = os.environ["EURUS_API_KEY"]
AGENCIA = os.environ["EURUS_AGENCIA"]    # e.g. "12345"
RUT = os.environ["EURUS_RUT"]            # e.g. "765432101"
numero_despacho = "DSP-2026-00123"

base = f"https://api-comex.eurus.pro/{AGENCIA}/v1"
response = httpx.get(
    f"{base}/dispatch/files/{numero_despacho}",
    params={"key": API_KEY, "rut": RUT},
    headers={"Accept": "application/json"},
    timeout=30.0,
)
response.raise_for_status()

payload = response.json()
print(f"{payload['total']} documents found")
for doc in payload["data"]:
    print(f"- {doc['fileTypeName']}: {doc['url']}")
```

## Step 3 — Understand the response

A successful request returns **HTTP 200** with a JSON body like this:

```json
{
  "data": [
    {
      "fileName": "FAC-AG-2026-00045.pdf",
      "fileTypeName": "FACTURA AGENCIA",
      "dispatchNumber": "DSP-2026-00123",
      "url": "https://storage.eurus.pro/files/765432101/dsp-2026-00123/fac-ag-00045.pdf",
      "issuedAt": "2026-04-10T15:02:44Z"
    },
    {
      "fileName": "BL-2026-00045.pdf",
      "fileTypeName": "CONOCIMIENTO DE EMBARQUE (B/L)",
      "dispatchNumber": "DSP-2026-00123",
      "url": "https://storage.eurus.pro/files/765432101/dsp-2026-00123/bl-00045.pdf",
      "issuedAt": "2026-04-12T09:30:00Z"
    }
  ],
  "total": 2
}
```

Each element of `data` has a signed URL you can use to **download the document** directly.

If something fails, you'll receive an HTTP error code with a standard error body. See [Errors](./errors.md).

## Step 4 — What's next

- **Filter by document type**: add `fileTypeName=FACTURA%20AGENCIA` to the same call to get only agency invoices. Check the [full list of `fileTypeName` values](./documentacion/index.md#filetypename) — and read the warning about **URL encoding**, as the values contain spaces.
- **Query by date range**: use the second endpoint `GET /dispatch/files` with `startDate`, `endDate` and `fileTypeName` to pull all documents of a type in a period. See the [interactive reference](./documentacion/index.md).
- **Read the conventions** for RUT, formats and versioning — see [Conventions](./conventions.md).
- **Explore the [Documentation](./documentacion/index.md) module** for more details and use cases.
