---
id: quickstart
title: Quickstart
sidebar_position: 2
slug: /quickstart
description: Primera llamada a la API Comex en menos de 5 minutos, con ejemplos en cURL, Node.js y Python.
---

# Quickstart

Esta guía te lleva de cero a hacer tu primera llamada exitosa a la **API Comex de EURUS PRO** en menos de cinco minutos. Al finalizar tendrás una petición autenticada funcionando desde tu terminal o desde un script.

## Prerrequisitos

- Un **API Key** válido proporcionado por EURUS PRO (ver más abajo cómo obtenerlo).
- Una herramienta para hacer peticiones HTTP. En los ejemplos usaremos **cURL**, **Node.js** (con `fetch` nativo, Node ≥ 18) y **Python 3** (con `httpx` o `requests`).
- Conexión a internet hacia `https://api.euruspro.com`.

## Paso 1 — Obtener un API Key

Contacta al equipo de EURUS PRO para solicitar un API Key de integración. El proceso actual es manual:

1. Envía un correo a [api@euruspro.com](mailto:api@euruspro.com) con el nombre de tu organización, el uso previsto y la dirección IP pública desde la que consumirás la API (opcional, para restringir el key).
2. Recibirás un API Key único y secreto. **Guárdalo en un lugar seguro** (gestor de secretos, variables de entorno, vault). Nunca lo subas a un repositorio público.

:::warning Seguridad del API Key
El API Key identifica a tu organización frente a la API Comex. Trátalo como una contraseña: nunca lo compartas, no lo publiques y rótalo si sospechas que se ha filtrado. Ver [Autenticación → Buenas prácticas](./authentication.md#buenas-prácticas).
:::

## Paso 2 — Hacer tu primera llamada

Vamos a listar los documentos asociados a una operación de exportación existente. La URL sigue el patrón:

```
GET https://api.euruspro.com/comex/v1/exportaciones/{id}/documentos?key=<API_KEY>
```

Reemplaza `<API_KEY>` por tu API Key real y `{id}` por el identificador UUID de una operación.

### cURL

```bash
curl -X GET \
  "https://api.euruspro.com/comex/v1/exportaciones/8e4d9b12-fe6a-4f88-a1b5-123456789abc/documentos?key=$EURUS_API_KEY" \
  -H "Accept: application/json"
```

> Exporta previamente tu API Key: `export EURUS_API_KEY="tu-api-key-aqui"`.

### Node.js (Node ≥ 18, `fetch` nativo)

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
console.log(`${data.total} documentos encontrados`);
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
print(f"{data['total']} documentos encontrados")
for doc in data["data"]:
    print(f"- {doc['tipo']}: {doc['url']}")
```

## Paso 3 — Entender la respuesta

Un request exitoso devuelve **HTTP 200** con un cuerpo JSON como el siguiente:

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

Si algo falla, recibirás un código HTTP de error con un cuerpo estándar de error. Ver [Errores](./errors.md).

## Paso 4 — Qué hacer a continuación

- **Registrar tu primera operación** con `POST /v1/exportaciones` — ver la [referencia interactiva](./reference).
- **Configurar webhooks** para recibir eventos en tiempo real — ver [Webhooks](./webhooks.md).
- **Leer las convenciones** de paginación, formatos y versionado — ver [Convenciones](./conventions.md).
