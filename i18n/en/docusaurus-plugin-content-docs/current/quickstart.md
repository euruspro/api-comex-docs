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
| **`idAgencia`** | Your EURUS PRO agency ID. An opaque string, not a number. | `z_cl_demo` |
| **`key`** | Secret API Key to authenticate calls. | `AIzaSy...` |
| **`rut`** | End client RUT, body plus check digit (see [RUT format](./conventions.md#rut-format)). It scopes the dispatches you see. | `999999999` |

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
The `rut` parameter is the **body plus the check digit**. Several forms are accepted and the API normalizes them internally to the same query:

| What you send | Queried as |
|---|---|
| `999999999` | `999999999` |
| `99.999.999-9` | `999999999` |
| `99999999K` | `999999991` |

The canonical form — digits only, with `K` folded to `1` — is the recommended one. See [Conventions → RUT format](./conventions.md#rut-format) for what gets rejected and why.

**The `rut` scopes what you see**: only dispatches belonging to that account, and their documents, are returned. A dispatch belonging to another client returns `404`, just like a nonexistent one.
:::

### cURL

```bash
export EURUS_API_KEY="your-api-key-here"
export EURUS_AGENCIA="z_cl_demo"
export EURUS_RUT="999999999"

curl -X GET \
  "https://api-comex.eurus.pro/$EURUS_AGENCIA/v1/dispatch/files/123457?key=$EURUS_API_KEY&rut=$EURUS_RUT" \
  -H "Accept: application/json"
```

### Node.js (Node ≥ 18, native `fetch`)

```javascript
const API_KEY = process.env.EURUS_API_KEY;
const AGENCIA = process.env.EURUS_AGENCIA;       // e.g. "z_cl_demo"
const RUT = process.env.EURUS_RUT;               // e.g. "999999999"
const numeroDespacho = "123457";

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

const { data, nextToken, unsignedCount } = await response.json();

// There is no `total` field: count what the page returned.
console.log(`${data.length} documents on this page`);
if (nextToken) console.log("More pages available; request with ?nextToken=" + nextToken);
if (unsignedCount) console.warn(`${unsignedCount} document(s) without a download URL`);

for (const doc of data) {
  // `name` is the document TYPE. And `url` may be missing: either the document
  // has no file, or its URL could not be signed.
  console.log(`- ${doc.name ?? "(no type)"}: ${doc.url ?? "(no URL)"}`);
}
```

### Python 3 (`httpx`)

```python
import os
import httpx

API_KEY = os.environ["EURUS_API_KEY"]
AGENCIA = os.environ["EURUS_AGENCIA"]    # e.g. "z_cl_demo"
RUT = os.environ["EURUS_RUT"]            # e.g. "999999999"
numero_despacho = "123457"

base = f"https://api-comex.eurus.pro/{AGENCIA}/v1"
response = httpx.get(
    f"{base}/dispatch/files/{numero_despacho}",
    params={"key": API_KEY, "rut": RUT},
    headers={"Accept": "application/json"},
    timeout=30.0,
)
response.raise_for_status()

payload = response.json()

# There is no `total` field: count what the page returned.
print(f"{len(payload['data'])} documents on this page")
if payload.get("nextToken"):
    print("More pages available; request with ?nextToken=" + payload["nextToken"])
if payload.get("unsignedCount"):
    print(f"{payload['unsignedCount']} document(s) without a download URL")

for doc in payload["data"]:
    # `name` is the document TYPE, and `url` may be missing.
    print(f"- {doc.get('name', '(no type)')}: {doc.get('url', '(no URL)')}")
```

## Step 3 — Understand the response

A successful request returns **HTTP 200** with a JSON body like this:

```json
{
  "date": "2026-01-31T22:04:31.000Z",
  "data": [
    {
      "id": "SqboswZtrqP1mDJl6dFj",
      "isActive": true,
      "name": "FACTURA AGENCIA",
      "numeroDespacho": "123457",
      "dispatch": {
        "id": "123457",
        "referencia": "REF-DEMO-0001"
      },
      "infoDoc": {
        "document": {
          "number": "45",
          "type": "FACTURA ELECTRONICA",
          "issueDate": "2026-01-05"
        }
      },
      "url": "https://storage.googleapis.com/demo-bucket/files/45.pdf?X-Goog-Signature=..."
    },
    {
      "id": "FILE-001",
      "isActive": false,
      "dispatch": {},
      "infoDoc": {}
    }
  ]
}
```

Four things about this response worth looking at before you write the parser:

| Observation | Detail |
|---|---|
| `date` is the response instant | Not a date of the document, nor of the range you queried. |
| **There is no `total`** | Pagination is cursor-based: see [Conventions → Pagination](./conventions.md#pagination). |
| `name` is the document **type** | Not the file name. It is the same value you send in `fileTypeName`. |
| The second element is real, not filler | It shows the guaranteed minimum: only `id`, `isActive`, `dispatch` and `infoDoc` are always there. Everything else **disappears from the JSON** when its value is empty, and can vary between elements of the same response. |

:::warning `dispatch` and `infoDoc` always exist, but may come back empty
And `{}` is truthy in JavaScript, so `if (item.infoDoc)` passes even when there is nothing inside. Check content: `item.infoDoc?.document?.number`. Explained in [Conventions → Field presence](./conventions.md#field-presence-the-thing-that-surprises-integrators-most).
:::

The `url` is a signed URL you can use to **download the document** directly, and it **expires in 1 hour**. It may be missing for two different reasons: the document has no associated file, or its URL could not be signed — that second case is counted in `unsignedCount`.

If something fails, you'll receive an HTTP error code with the standard error body. See [Errors](./errors.md).

## Step 4 — What's next

- **Filter by document type**: add `fileTypeName=FACTURA%20AGENCIA` to the same call to get only agency invoices. Check the [full list of `fileTypeName` values](./documentacion/index.md#filetypename) — and read the warning about **URL encoding**, as the values contain spaces.
- **Query by date range**: use the second endpoint `GET /dispatch/files` with `startDate`, `endDate` and `fileTypeName` to pull all documents of a type in a period. See the [interactive reference](./documentacion/index.md).
- **Read the conventions** for RUT, formats and versioning — see [Conventions](./conventions.md).
- **Explore the [Documentation](./documentacion/index.md) module** for more details and use cases.
