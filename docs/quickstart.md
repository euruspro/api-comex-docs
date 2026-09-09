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
| **`rut`** | RUT del cliente final, cuerpo más dígito verificador (ver [Formato de RUT](./conventions.md#formato-de-rut)). Acota los despachos que ves. | `999999999` |

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
El parámetro `rut` es el **cuerpo más el dígito verificador**. Se aceptan varias formas y la API las normaliza internamente a la misma consulta:

| Lo que envías | Se consulta como |
|---|---|
| `999999999` | `999999999` |
| `99.999.999-9` | `999999999` |
| `99999999K` | `999999991` |

La forma canónica —solo dígitos, con la `K` convertida a `1`— es la recomendada. Ver [Convenciones → Formato de RUT](./conventions.md#formato-de-rut) para qué se rechaza y por qué.

**El `rut` acota lo que ves**: solo se devuelven despachos de esa cuenta y sus documentos. Un despacho de otro cliente responde `404`, igual que uno inexistente.
:::

### cURL

```bash
export EURUS_API_KEY="tu-api-key-aqui"
export EURUS_AGENCIA="z_cl_demo"
export EURUS_RUT="999999999"

curl -X GET \
  "https://api-comex.eurus.pro/$EURUS_AGENCIA/v1/dispatch/files/123457?key=$EURUS_API_KEY&rut=$EURUS_RUT" \
  -H "Accept: application/json"
```

### Node.js (Node ≥ 18, `fetch` nativo)

```javascript
const API_KEY = process.env.EURUS_API_KEY;
const AGENCIA = process.env.EURUS_AGENCIA;       // ej. "z_cl_demo"
const RUT = process.env.EURUS_RUT;               // ej. "999999999"
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

// No hay campo `total`: se cuenta lo que trajo la pagina.
console.log(`${data.length} documentos en esta pagina`);
if (nextToken) console.log("Hay mas paginas; pedir con ?nextToken=" + nextToken);
if (unsignedCount) console.warn(`${unsignedCount} documento(s) sin URL de descarga`);

for (const doc of data) {
  // `name` es el TIPO de documento. Y `url` puede faltar: el documento no
  // tiene archivo, o su URL no se pudo firmar.
  console.log(`- ${doc.name ?? "(sin tipo)"}: ${doc.url ?? "(sin URL)"}`);
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

# No hay campo `total`: se cuenta lo que trajo la pagina.
print(f"{len(payload['data'])} documentos en esta pagina")
if payload.get("nextToken"):
    print("Hay mas paginas; pedir con ?nextToken=" + payload["nextToken"])
if payload.get("unsignedCount"):
    print(f"{payload['unsignedCount']} documento(s) sin URL de descarga")

for doc in payload["data"]:
    # `name` es el TIPO de documento, y `url` puede faltar.
    print(f"- {doc.get('name', '(sin tipo)')}: {doc.get('url', '(sin URL)')}")
```

## Paso 3 — Entender la respuesta

Un request exitoso devuelve **HTTP 200** con un cuerpo JSON como el siguiente:

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

Cuatro cosas de esta respuesta que conviene mirar antes de escribir el parser:

| Observación | Detalle |
|---|---|
| `date` es el instante de la respuesta | No es una fecha del documento ni del rango consultado. |
| **No hay `total`** | La paginación es por cursor: ver [Convenciones → Paginación](./conventions.md#paginación). |
| `name` es el **tipo** de documento | No es el nombre del archivo. Es el mismo valor que se envía en `fileTypeName`. |
| El segundo elemento es real, no un relleno | Muestra el mínimo garantizado: solo `id`, `isActive`, `dispatch` e `infoDoc` están siempre. El resto **desaparece del JSON** cuando su valor es vacío, y puede variar entre elementos de la misma respuesta. |

:::warning `dispatch` e `infoDoc` existen siempre, pero pueden venir vacíos
Y `{}` es *truthy* en JavaScript, así que `if (item.infoDoc)` se cumple aunque no haya nada dentro. Verifica contenido: `item.infoDoc?.document?.number`. Está explicado en [Convenciones → Presencia de campos](./conventions.md#presencia-de-campos-lo-que-más-sorprende-al-integrar).
:::

La `url` es una URL firmada que puedes usar para **descargar el documento** directamente, y **caduca en 1 hora**. Puede faltar por dos motivos distintos: el documento no tiene archivo asociado, o su URL no se pudo firmar — ese segundo caso se cuenta en `unsignedCount`.

Si algo falla, recibirás un código HTTP de error con el cuerpo estándar. Ver [Errores](./errors.md).

## Paso 4 — Qué hacer a continuación

- **Filtrar por tipo de documento**: añade el parámetro `fileTypeName=FACTURA%20AGENCIA` a la misma llamada para obtener solo facturas de agencia. Consulta la [lista completa de `fileTypeName`](./documentacion/index.md#filetypename) — y lee la advertencia sobre **URL encoding** porque los valores contienen espacios.
- **Consultar por rango de fechas**: usa el segundo endpoint `GET /dispatch/files` con `startDate`, `endDate` y `fileTypeName` para extraer todos los documentos de un tipo en un período. Ver la [referencia interactiva](./documentacion/index.md).
- **Leer las convenciones** de RUT, formatos y versionado — ver [Convenciones](./conventions.md).
- **Explorar el módulo de [Documentación](./documentacion/index.md)** con más detalles y casos de uso.
