---
id: authentication
title: Autenticación
sidebar_position: 3
slug: /authentication
description: Cómo autenticar tus llamadas a la API Comex mediante API Key en query parameter.
---

# Autenticación

La API Comex de EURUS PRO está expuesta a través de **Google Cloud API Gateway**. La autenticación se realiza mediante un **API Key** que debe enviarse como **parámetro de query** en cada llamada.

:::important No uses `Authorization`
A diferencia de muchas APIs REST, **la API Comex no acepta un header `Authorization`**. El API Key debe ir siempre en la query string con el nombre `key`. Este es el estándar exigido por Google API Gateway.
:::

## Formato

Agrega el parámetro `?key=<API_KEY>` al final de cualquier URL:

```
GET https://api-comex.eurus.pro/z_cl_demo/v1/dispatch/files/123457?key=YOUR_API_KEY&rut=999999999
```

:::note Parámetros obligatorios
Además del `key`, casi todos los endpoints requieren el parámetro `rut` (ver [Formato de RUT](./conventions.md#formato-de-rut)). Los parámetros se separan con `&`.
:::

## Ejemplos

### cURL

```bash
curl "https://api-comex.eurus.pro/z_cl_demo/v1/dispatch/files/123457?key=$EURUS_API_KEY&rut=999999999"
```

### Node.js

```javascript
const url = new URL("https://api-comex.eurus.pro/z_cl_demo/v1/dispatch/files/123457");
url.searchParams.set("key", process.env.EURUS_API_KEY);
url.searchParams.set("rut", "999999999");

const response = await fetch(url);
```

### Python

```python
import httpx, os

response = httpx.get(
    "https://api-comex.eurus.pro/z_cl_demo/v1/dispatch/files/123457",
    params={"key": os.environ["EURUS_API_KEY"], "rut": "999999999"},
)
```

:::tip Usa el objeto `URL` o `params`
Siempre construye la URL con un helper que codifique correctamente los parámetros (`URLSearchParams` en JS, `params={}` en `httpx`/`requests`). Nunca concatenes strings crudos — un API Key con caracteres especiales puede romper la URL.
:::

## Obtener un API Key

El proceso actual es manual:

1. Envía un correo a [api@eurus.pro](mailto:api@eurus.pro) solicitando acceso.
2. Indica:
   - Nombre de tu organización y RUT/ID fiscal.
   - Uso previsto (integración interna, portal, app móvil, etc.).
   - Entornos (producción, staging).
   - IPs o referrers desde los que vas a consumir, si deseas restricciones.
3. Recibirás:
   - Tu **`idAgencia`** (se incluye en el path de todas las URLs).
   - Un **API Key** único por entorno.

## Errores de autenticación

| Código | Causa | Acción |
|---|---|---|
| `403 Forbidden` + `code: API_KEY_INVALID` | API Key ausente, revocada o no utilizable. | Verifica que `?key=...` esté presente y sea la vigente. **La API responde 403, no 401, también cuando la key falta.** |
| `403 Forbidden` + `code: PROJECT_ID_UNAUTHORIZED` | La API Key es válida pero no está autorizada para el `idAgencia` de la ruta. | Confirma con EURUS PRO qué agencias tiene autorizadas tu key. |

El cuerpo de la respuesta seguirá el [formato estándar de error](./errors.md).

## Buenas prácticas

### 1. Nunca commitees el API Key

Jamás incluyas el API Key en código fuente, repositorios Git, issues, tickets, capturas de pantalla ni en logs. Usa siempre:

- **Variables de entorno** (`process.env.EURUS_API_KEY`, `os.environ["EURUS_API_KEY"]`).
- **Gestores de secretos** (Google Secret Manager, AWS Secrets Manager, HashiCorp Vault, Doppler, 1Password CLI).
- **Archivos `.env` locales** que estén en `.gitignore`.

### 2. Restringe el uso del key

Al solicitar el key, pide restricciones:

- **Por IP** si tu integración corre desde servidores con IP fija.
- **Por referrer HTTP** si lo usas desde una SPA (menos recomendado, el key es visible en el navegador).
- **Por API** para limitar qué endpoints puede invocar.

### 3. Rota regularmente

Establece una política de rotación (por ejemplo, cada 90 días). Si sospechas que el key se ha filtrado, **rota inmediatamente** solicitando uno nuevo a EURUS PRO y descarta el anterior.

### 4. Un key por entorno y por aplicación

No reutilices el mismo key entre producción y staging, ni entre aplicaciones distintas. Esto facilita la auditoría y limita el blast radius en caso de compromiso.

### 5. Monitorea el uso

Revisa periódicamente los logs y métricas de uso que EURUS PRO ponga a disposición. Alertas sobre picos anómalos de tráfico son una señal temprana de abuso o filtración.

## Qué hacer si el API Key se filtra

1. **Revoca inmediatamente** el key contactando a EURUS PRO (`api@eurus.pro`) indicando el incidente.
2. Solicita un key nuevo.
3. Actualiza tus secretos y redeploya tus servicios.
4. Revisa los logs buscando actividad no autorizada entre la filtración y la revocación.
5. Documenta el incidente internamente (post-mortem).
