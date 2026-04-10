---
id: webhooks
title: Webhooks
sidebar_position: 5
slug: /webhooks
description: How to receive real-time events from the Comex API via HTTPS webhooks.
---

# Webhooks

**Webhooks** are HTTP notifications the Comex API sends proactively to your system when a relevant event occurs (an operation state change, a document issuance, etc.). This way you avoid constant polling and react in real time.

:::note Placeholder
The exact payload formats and event types shown on this page are the initial proposal and will be confirmed before the public release.
:::

## How they work

1. You register a **public HTTPS URL** with EURUS PRO as the webhook destination (currently a manual process — email [api@eurus.pro](mailto:api@eurus.pro)).
2. EURUS PRO delivers a shared **secret** that you'll use to verify the signature of every event.
3. When an event occurs, EURUS PRO sends a `POST` to your URL with a JSON payload and specific headers.
4. Your endpoint must respond with `2xx` in under **5 seconds**. Otherwise the event is considered failed and goes into the retry queue.

## Available events

| Event | When it fires |
|---|---|
| `dispatch.created` | A new dispatch was registered. |
| `dispatch.updated` | A field of an existing dispatch changed. |
| `dispatch.estado_changed` | The dispatch moved from one state to another. |
| `file.emitido` | A new document associated with a dispatch was issued. |
| `file.rechazado` | A document was rejected by the issuing entity. |

## Payload format

```json
{
  "id": "evt_01HW1QZ8C4T2K3P0J9V5R7X2B6",
  "type": "dispatch.estado_changed",
  "createdAt": "2026-04-10T17:05:12Z",
  "apiVersion": "v1",
  "data": {
    "idAgencia": "12345",
    "rut": "765432101",
    "dispatch": {
      "numeroDespacho": "DSP-2026-00123",
      "estado": "EN_TRAMITE",
      "estadoAnterior": "REGISTRADO",
      "updatedAt": "2026-04-10T17:05:12Z"
    }
  }
}
```

## Headers sent

| Header | Description |
|---|---|
| `Content-Type` | Always `application/json`. |
| `X-Eurus-Event` | Event name (`operacion.estado_changed`). |
| `X-Eurus-Event-Id` | Unique event identifier. Use it to **deduplicate**. |
| `X-Eurus-Delivery` | Delivery attempt identifier (changes on retries). |
| `X-Eurus-Signature` | HMAC-SHA256 signature of the body, in the format `sha256=<hex>`. |
| `X-Eurus-Timestamp` | Epoch (seconds) when the event was generated. |

## Signature verification

**Never process a webhook without verifying the signature.** The procedure is:

1. Concatenate: `<X-Eurus-Timestamp>.<raw body>`.
2. Compute `HMAC-SHA256` using your **webhook secret** as the key.
3. Compare the result (in hex) against `X-Eurus-Signature` (without the `sha256=` prefix).
4. Use **constant-time** comparison to prevent timing attacks.
5. Reject events with a timestamp older than 5 minutes (replay prevention).

### Node.js

```javascript
import crypto from "node:crypto";
import express from "express";

const app = express();
const SECRET = process.env.EURUS_WEBHOOK_SECRET;

// IMPORTANT: we need the raw body to verify the signature
app.post("/webhooks/eurus", express.raw({ type: "application/json" }), (req, res) => {
  const signature = req.header("X-Eurus-Signature") || "";
  const timestamp = req.header("X-Eurus-Timestamp") || "";

  // 1. Prevent replay: reject events > 5 min old
  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (ageSeconds > 300) return res.status(400).send("stale");

  // 2. Compute expected signature
  const payload = `${timestamp}.${req.body.toString("utf8")}`;
  const expected = "sha256=" + crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex");

  // 3. Constant-time comparison
  const ok = signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!ok) return res.status(401).send("invalid signature");

  // 4. Process
  const event = JSON.parse(req.body.toString("utf8"));
  console.log(`Event received: ${event.type}`, event.data);

  // Respond 2xx as soon as possible — queue heavy processing
  res.status(200).send("ok");
});

app.listen(3000);
```

### Python (FastAPI)

```python
import os
import hmac
import hashlib
import time
from fastapi import FastAPI, Request, HTTPException

app = FastAPI()
SECRET = os.environ["EURUS_WEBHOOK_SECRET"].encode()

@app.post("/webhooks/eurus")
async def eurus_webhook(request: Request):
    signature = request.headers.get("X-Eurus-Signature", "")
    timestamp = request.headers.get("X-Eurus-Timestamp", "")
    body = await request.body()

    # 1. Prevent replay
    try:
        if abs(time.time() - int(timestamp)) > 300:
            raise HTTPException(status_code=400, detail="stale")
    except ValueError:
        raise HTTPException(status_code=400, detail="bad timestamp")

    # 2. Compute expected signature
    payload = f"{timestamp}.{body.decode('utf-8')}".encode()
    expected = "sha256=" + hmac.new(SECRET, payload, hashlib.sha256).hexdigest()

    # 3. Constant-time comparison
    if not hmac.compare_digest(signature, expected):
        raise HTTPException(status_code=401, detail="invalid signature")

    # 4. Process
    event = await request.json()
    print(f"Event received: {event['type']}", event["data"])

    return {"status": "ok"}
```

## Retry policy

If your endpoint responds with a non-`2xx` code or takes longer than 5 seconds, the event is queued and retried with exponential back-off:

| Attempt | Delay |
|---|---|
| 1 | immediate |
| 2 | +1 min |
| 3 | +5 min |
| 4 | +30 min |
| 5 | +2 h |
| 6 | +12 h |
| 7 | +24 h |

After 7 failed attempts the event is discarded and a record is left in your integration's error log (queryable by support).

## Best practices

- **Deduplication**: store processed `X-Eurus-Event-Id` values (last 24h) and discard duplicates — retries may resend the same event.
- **Idempotency**: design the handler so that processing the same event twice is safe.
- **Respond fast**: return `200` as soon as possible and queue heavy work in an async worker.
- **Structured logging**: record `event.id`, `event.type`, `delivery` and timestamp to simplify debugging.
- **Monitoring**: alert if your endpoint accumulates errors — you may be losing events.
