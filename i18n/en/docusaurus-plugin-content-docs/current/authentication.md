---
id: authentication
title: Authentication
sidebar_position: 3
slug: /authentication
description: How to authenticate your calls to the Comex API using an API Key in a query parameter.
---

# Authentication

The EURUS PRO Comex API is exposed through **Google Cloud API Gateway**. Authentication is done via an **API Key** sent as a **query parameter** in every call.

:::important Don't use `Authorization`
Unlike many REST APIs, **the Comex API does not accept an `Authorization` header**. The API Key must always go in the query string under the name `key`. This is the standard required by Google API Gateway.
:::

## Format

Add the `?key=<API_KEY>` parameter at the end of any URL:

```
GET https://api.euruspro.com/comex/v1/exportaciones/8e4d9b12-fe6a-4f88-a1b5-123456789abc?key=YOUR_API_KEY
```

If the URL already has other parameters, use `&`:

```
GET https://api.euruspro.com/comex/v1/exportaciones?estado=REGISTRADA&key=YOUR_API_KEY
```

## Examples

### cURL

```bash
curl "https://api.euruspro.com/comex/v1/exportaciones?key=$EURUS_API_KEY"
```

### Node.js

```javascript
const url = new URL("https://api.euruspro.com/comex/v1/exportaciones");
url.searchParams.set("key", process.env.EURUS_API_KEY);

const response = await fetch(url);
```

### Python

```python
import httpx, os

response = httpx.get(
    "https://api.euruspro.com/comex/v1/exportaciones",
    params={"key": os.environ["EURUS_API_KEY"]},
)
```

:::tip Use `URL` or `params`
Always build the URL with a helper that properly encodes parameters (`URLSearchParams` in JS, `params={}` in `httpx`/`requests`). Never concatenate raw strings — an API Key with special characters can break the URL.
:::

## Getting an API Key

The current process is manual:

1. Email [api@euruspro.com](mailto:api@euruspro.com) to request access.
2. Provide:
   - Your organization's name and tax ID.
   - Intended use (internal integration, portal, mobile app, etc.).
   - Environments (production, staging).
   - IPs or referrers from which you'll consume, if you want restrictions.
3. You'll receive a unique API Key per environment.

## Authentication errors

| Code | Cause | Action |
|---|---|---|
| `401 Unauthorized` | API Key missing, expired or revoked. | Verify `?key=...` is present and current. |
| `403 Forbidden` | Valid API Key but no permission, or IP/referrer blocked. | Confirm permissions and restrictions with EURUS PRO. |
| `429 Too Many Requests` | You exceeded the per-minute call limit. | Implement exponential back-off and review [rate limits](./conventions.md#rate-limits). |

The response body follows the [standard error format](./errors.md).

## Best practices

### 1. Never commit the API Key

Never include the API Key in source code, Git repositories, issues, tickets, screenshots or logs. Always use:

- **Environment variables** (`process.env.EURUS_API_KEY`, `os.environ["EURUS_API_KEY"]`).
- **Secret managers** (Google Secret Manager, AWS Secrets Manager, HashiCorp Vault, Doppler, 1Password CLI).
- **Local `.env` files** that are in `.gitignore`.

### 2. Restrict the key's usage

When requesting the key, ask for restrictions:

- **By IP** if your integration runs from servers with a fixed IP.
- **By HTTP referrer** if you use it from a SPA (less recommended — the key is visible in the browser).
- **By API** to limit which endpoints it can invoke.

### 3. Rotate regularly

Set a rotation policy (e.g. every 90 days). If you suspect the key has leaked, **rotate immediately** by requesting a new one from EURUS PRO and discarding the old.

### 4. One key per environment and per application

Don't reuse the same key between production and staging, nor between different applications. This makes auditing easier and limits the blast radius in case of compromise.

### 5. Monitor usage

Periodically review the usage logs and metrics that EURUS PRO provides. Alerts on abnormal traffic spikes are an early signal of abuse or leaks.

## What to do if the API Key leaks

1. **Revoke immediately** by contacting EURUS PRO (`api@euruspro.com`) and reporting the incident.
2. Request a new key.
3. Update your secrets and redeploy your services.
4. Review logs looking for unauthorized activity between leak and revocation.
5. Document the incident internally (post-mortem).
