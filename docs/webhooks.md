---
id: webhooks
title: Webhooks
sidebar_position: 5
slug: /webhooks
description: Cómo recibir eventos en tiempo real desde la API Comex mediante webhooks HTTPS.
---

# Webhooks

Los **webhooks** son notificaciones HTTP que la API Comex envía proactivamente a tu sistema cuando ocurre un evento relevante (cambio de estado de una operación, emisión de un documento, etc.). Así evitas hacer polling constante y reaccionas en tiempo real.

:::note Placeholder
Los formatos exactos de payload y los tipos de eventos mostrados en esta página son la propuesta inicial y serán confirmados antes del release público.
:::

## Cómo funcionan

1. Registras una **URL HTTPS pública** en EURUS PRO como destino de webhooks (proceso manual actualmente, enviar a [api@eurus.pro](mailto:api@eurus.pro)).
2. EURUS PRO te entrega un **secret** compartido que usarás para verificar la firma de cada evento.
3. Cuando ocurre un evento, EURUS PRO envía un `POST` a tu URL con un payload JSON y headers específicos.
4. Tu endpoint debe responder con `2xx` en menos de **5 segundos**. Si no, el evento se considera fallido y entra en cola de reintento.

## Eventos disponibles

| Evento | Cuándo se dispara |
|---|---|
| `dispatch.created` | Se registró un nuevo despacho. |
| `dispatch.updated` | Cambió un campo de un despacho existente. |
| `dispatch.estado_changed` | El despacho pasó de un estado a otro. |
| `file.emitido` | Se emitió un nuevo documento asociado a un despacho. |
| `file.rechazado` | Un documento fue rechazado por la entidad emisora. |

## Formato del payload

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

## Headers enviados

| Header | Descripción |
|---|---|
| `Content-Type` | Siempre `application/json`. |
| `X-Eurus-Event` | Nombre del evento (`operacion.estado_changed`). |
| `X-Eurus-Event-Id` | Identificador único del evento. Úsalo para **deduplicar**. |
| `X-Eurus-Delivery` | Identificador del intento de entrega (cambia en reintentos). |
| `X-Eurus-Signature` | Firma HMAC-SHA256 del body, en formato `sha256=<hex>`. |
| `X-Eurus-Timestamp` | Epoch (segundos) en que se generó el evento. |

## Verificación de firma

**Nunca proceses un webhook sin verificar la firma.** El procedimiento es:

1. Concatena: `<X-Eurus-Timestamp>.<body crudo>`.
2. Calcula `HMAC-SHA256` con tu **webhook secret** como clave.
3. Compara el resultado (en hex) con el valor de `X-Eurus-Signature` (sin el prefijo `sha256=`).
4. Usa comparación **constant-time** para evitar ataques de timing.
5. Rechaza eventos con timestamp más antiguo de 5 minutos (prevención de replay).

### Node.js

```javascript
import crypto from "node:crypto";
import express from "express";

const app = express();
const SECRET = process.env.EURUS_WEBHOOK_SECRET;

// IMPORTANT: necesitamos el body crudo para verificar la firma
app.post("/webhooks/eurus", express.raw({ type: "application/json" }), (req, res) => {
  const signature = req.header("X-Eurus-Signature") || "";
  const timestamp = req.header("X-Eurus-Timestamp") || "";

  // 1. Prevenir replay: rechazar eventos > 5 min
  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (ageSeconds > 300) return res.status(400).send("stale");

  // 2. Calcular firma esperada
  const payload = `${timestamp}.${req.body.toString("utf8")}`;
  const expected = "sha256=" + crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex");

  // 3. Comparación constant-time
  const ok = signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!ok) return res.status(401).send("invalid signature");

  // 4. Procesar
  const event = JSON.parse(req.body.toString("utf8"));
  console.log(`Evento recibido: ${event.type}`, event.data);

  // Devolver 2xx lo antes posible — encola el procesamiento pesado
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

    # 1. Prevenir replay
    try:
        if abs(time.time() - int(timestamp)) > 300:
            raise HTTPException(status_code=400, detail="stale")
    except ValueError:
        raise HTTPException(status_code=400, detail="bad timestamp")

    # 2. Calcular firma esperada
    payload = f"{timestamp}.{body.decode('utf-8')}".encode()
    expected = "sha256=" + hmac.new(SECRET, payload, hashlib.sha256).hexdigest()

    # 3. Comparación constant-time
    if not hmac.compare_digest(signature, expected):
        raise HTTPException(status_code=401, detail="invalid signature")

    # 4. Procesar
    event = await request.json()
    print(f"Evento recibido: {event['type']}", event["data"])

    return {"status": "ok"}
```

## Política de reintentos

Si tu endpoint responde con un código distinto de `2xx` o tarda más de 5 segundos, el evento entra en cola y se reintenta con back-off exponencial:

| Intento | Delay |
|---|---|
| 1 | inmediato |
| 2 | +1 min |
| 3 | +5 min |
| 4 | +30 min |
| 5 | +2 h |
| 6 | +12 h |
| 7 | +24 h |

Tras 7 intentos fallidos el evento se descarta y se deja un registro en el log de errores de tu integración (consultable por soporte).

## Buenas prácticas

- **Deduplicación**: almacena los `X-Eurus-Event-Id` procesados (últimas 24h) y descarta duplicados — los reintentos pueden reenviar el mismo evento.
- **Idempotencia**: diseña el handler de modo que procesar el mismo evento dos veces sea seguro.
- **Respuesta rápida**: responde `200` lo antes posible, y encola el trabajo pesado en un worker asíncrono.
- **Logging estructurado**: registra `event.id`, `event.type`, `delivery` y timestamp para facilitar debugging.
- **Monitoreo**: alerta si tu endpoint acumula errores — podrías estar perdiendo eventos.
