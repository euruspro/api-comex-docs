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

- A valid **API Key** provided by EURUS PRO (see below how to get one).
- A tool to make HTTP requests. We'll use **cURL**, **Node.js** (with native `fetch`, Node ≥ 18) and **Python 3** (with `httpx` or `requests`).
- Network access to `https://api.euruspro.com`.

## Step 1 — Get an API Key

Contact the EURUS PRO team to request an integration API Key. The current process is manual:

1. Email [api@euruspro.com](mailto:api@euruspro.com) with your organization's name, intended use, and the public IP address from which you will consume the API (optional, to restrict the key).
2. You'll receive a unique, secret API Key. **Store it safely** (secret manager, environment variables, vault). Never commit it to a public repository.

:::warning API Key security
The API Key identifies your organization to the Comex API. Treat it like a password: never share it, never publish it, and rotate it if you suspect a leak. See [Authentication → Best practices](./authentication.md#best-practices).
:::

## Step 2 — Make your first call

Let's list the documents associated with an existing export operation. The URL follows this pattern:

```
GET https://api.euruspro.com/comex/v1/exportaciones/{id}/documentos?key=<API_KEY>
```

Replace `<API_KEY>` with your real API Key and `{id}` with an operation's UUID.

### cURL

```bash
curl -X GET \
  "https://api.euruspro.com/comex/v1/exportaciones/8e4d9b12-fe6a-4f88-a1b5-123456789abc/documentos?key=$EURUS_API_KEY" \
  -H "Accept: application/json"
```

> Export your API Key beforehand: `export EURUS_API_KEY="your-api-key-here"`.

### Node.js (Node ≥ 18, native `fetch`)

```javascript
const API_KEY = process.env.EURUS_API_KEY;
const BASE_URL = "https://api.euruspro.com/comex/v1";
const operacionId = "8e4d9b12-fe6a-4f88-a1b5-123456789abc";

const url = `${BASE_URL}/exportaciones/${operacionId}/documentos?key=${encodeURIComponent(API_KEY)}`;

const response = await fetch(url, {
  headers: { "Accept": "application/json" },
});

if (!response.ok) {
  throw new Error(`Error ${response.status}: ${await response.text()}`);
}

const data = await response.json();
console.log(`${data.total} documents found`);
console.log(data.data);
```

### Python 3 (`httpx`)

```python
import os
import httpx

API_KEY = os.environ["EURUS_API_KEY"]
BASE_URL = "https://api.euruspro.com/comex/v1"
operacion_id = "8e4d9b12-fe6a-4f88-a1b5-123456789abc"

response = httpx.get(
    f"{BASE_URL}/exportaciones/{operacion_id}/documentos",
    params={"key": API_KEY},
    headers={"Accept": "application/json"},
    timeout=30.0,
)
response.raise_for_status()

data = response.json()
print(f"{data['total']} documents found")
for doc in data["data"]:
    print(f"- {doc['tipo']}: {doc['url']}")
```

## Step 3 — Understand the response

A successful request returns **HTTP 200** with a JSON body like this:

```json
{
  "data": [
    {
      "id": "a1b2c3d4-5678-4abc-9def-0123456789ab",
      "tipo": "FACTURA_COMERCIAL",
      "estado": "EMITIDO",
      "url": "https://storage.euruspro.com/documentos/a1b2c3d4.pdf",
      "numeroExterno": "F-2026-00045",
      "createdAt": "2026-04-10T15:02:44Z",
      "emitidoAt": "2026-04-10T15:10:00Z"
    }
  ],
  "total": 1
}
```

If something fails, you'll receive an HTTP error code with a standard error body. See [Errors](./errors.md).

## Step 4 — What's next

- **Register your first operation** using `POST /v1/exportaciones` — see the [interactive reference](./reference).
- **Configure webhooks** to receive real-time events — see [Webhooks](./webhooks.md).
- **Read the conventions** on pagination, formats and versioning — see [Conventions](./conventions.md).
