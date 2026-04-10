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

Para hacer tu primera llamada necesitas **tres datos** que debe proveerte EURUS PRO:

| Dato | Descripción | Ejemplo |
|---|---|---|
| **`idAgencia`** | ID numérico de tu agencia en EURUS PRO. | `12345` |
| **`key`** | API Key secreta para autenticar las llamadas. | `AIzaSy...` |
| **`rut`** | RUT del cliente final, en formato **solo dígitos** (ver [Formato de RUT](./conventions.md#formato-de-rut)). | `765432101` |

Además necesitas:

- Una herramienta para hacer peticiones HTTP. En los ejemplos usaremos **cURL**, **Node.js** (con `fetch` nativo, Node ≥ 18) y **Python 3** (con `httpx` o `requests`).
- Un **`numeroDespacho`** válido del cliente con el que vas a probar.
- Conexión a internet hacia `https://api-comex.eurus.pro`.

## Paso 1 — Obtener credenciales

Contacta al equipo de EURUS PRO para solicitar acceso a la API:

1. Envía un correo a [api@eurus.pro](mailto:api@eurus.pro) con el nombre de tu organización, el uso previsto y la dirección IP pública desde la que consumirás la API (opcional, para restringir el key).
2. Recibirás:
   - Tu **`idAgencia`** asignado.
   - Un **API Key** único y secreto.
3. **Guárdalo en un lugar seguro** (gestor de secretos, variables de entorno, vault). Nunca lo subas a un repositorio público.

:::warning Seguridad del API Key
El API Key identifica a tu organización frente a la API Comex. Trátalo como una contraseña: nunca lo compartas, no lo publiques y rótalo si sospechas que se ha filtrado. Ver [Autenticación → Buenas prácticas](./authentication.md#buenas-prácticas).
:::

## Paso 2 — Hacer tu primera llamada

Vamos a listar los documentos asociados a un despacho conocido. La URL sigue el patrón:

```
GET https://api-comex.eurus.pro/{idAgencia}/v1/dispatch/files/{numeroDespacho}?key=<API_KEY>&rut=<RUT>
```

Reemplaza `{idAgencia}`, `<API_KEY>`, `{numeroDespacho}` y `<RUT>` por tus valores reales.

:::tip Formato del RUT
El parámetro `rut` debe enviarse **solo con dígitos**, sin puntos, sin guion y sin la letra verificadora. Si el RUT termina en "K", reemplaza la K por "1".

- `76.543.210-K` → `765432101`
- `12.345.678-9` → `123456789`
:::

### cURL

```bash
export EURUS_API_KEY="tu-api-key-aqui"
export EURUS_AGENCIA="12345"
export EURUS_RUT="765432101"

curl -X GET \
  "https://api-comex.eurus.pro/$EURUS_AGENCIA/v1/dispatch/files/DSP-2026-00123?key=$EURUS_API_KEY&rut=$EURUS_RUT" \
  -H "Accept: application/json"
```

### Node.js (Node ≥ 18, `fetch` nativo)

```javascript
const API_KEY = process.env.EURUS_API_KEY;
const AGENCIA = process.env.EURUS_AGENCIA;       // ej. "12345"
const RUT = process.env.EURUS_RUT;               // ej. "765432101"
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
console.log(`${total} documentos encontrados`);
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
print(f"{payload['total']} documentos encontrados")
for doc in payload["data"]:
    print(f"- {doc['fileTypeName']}: {doc['url']}")
```

## Paso 3 — Entender la respuesta

Un request exitoso devuelve **HTTP 200** con un cuerpo JSON como el siguiente:

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

Cada elemento de `data` tiene una URL firmada que puedes usar para **descargar el documento** directamente.

Si algo falla, recibirás un código HTTP de error con un cuerpo estándar de error. Ver [Errores](./errors.md).

## Paso 4 — Qué hacer a continuación

- **Filtrar por tipo de documento**: añade el parámetro `fileTypeName=FACTURA%20AGENCIA` a la misma llamada para obtener solo facturas de agencia. Consulta la [lista completa de `fileTypeName`](./documentacion/index.md#filetypename) — y lee la advertencia sobre **URL encoding** porque los valores contienen espacios.
- **Consultar por rango de fechas**: usa el segundo endpoint `GET /dispatch/files` con `startDate`, `endDate` y `fileTypeName` para extraer todos los documentos de un tipo en un período. Ver la [referencia interactiva](./documentacion/index.md).
- **Leer las convenciones** de RUT, formatos y versionado — ver [Convenciones](./conventions.md).
- **Explorar el módulo de [Documentación](./documentacion/index.md)** con más detalles y casos de uso.
