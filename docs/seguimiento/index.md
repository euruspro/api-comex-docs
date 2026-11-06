---
id: index
title: Seguimiento
slug: /seguimiento
description: Módulo de seguimiento — estado y trazabilidad de los despachos de comercio exterior.
---

# Seguimiento

El módulo de **Seguimiento** permite consultar el estado de los despachos de comercio exterior: tipo de registro, estado de la DIN o el DUS, fechas relevantes y prioridad.

Sirve tanto para **importaciones** como para **exportaciones**: el campo `recordType` distingue el tipo de operación.

## Endpoints disponibles

Los tres en la etiqueta **Seguimiento** de la [Referencia de la API](../reference/api-comex-eurus-pro.info.mdx):

1. **[`GET /dispatch/{numeroDespacho}/status`](../reference/consultar-estado-despacho.api.mdx)**
   Estado de un **despacho específico**.

2. **[`GET /dispatch/status`](../reference/listar-estados-despacho.api.mdx)**
   **Todos los despachos de tu cuenta**, con filtros por tipo de registro y estado de cierre, ordenamiento y límite.

3. **[`GET /dispatch/{numeroDespacho}`](../reference/consultar-despacho.api.mdx)**
   **Datos de un despacho**: aduana, nave, consignante, valores CIF y FOB, y sus fechas.

## Estado y datos del despacho

`/status` y el despacho en sí responden cosas distintas:

| | `GET /dispatch/{numeroDespacho}/status` | `GET /dispatch/{numeroDespacho}` |
|---|---|---|
| Qué trae | Seguimiento: `recordType`, `EstadoDIN` o `EstadoDUS`, `isCompleted`, prioridad, plazo | Datos del negocio: aduana, nave, consignante, `valorCif`, `valorFob`, fechas de arribo, aceptación y retiro |
| Sin dato | `null` en todas las claves | Textos como `""`; fechas y montos como `null`, nunca `0` |

`GET /dispatch/{numeroDespacho}` devuelve en `data` **los mismos datos** que traen en `dispatch` los [archivos](../documentacion/index.md) y los [desembolsos](../desembolsos/index.md), más el `id` del despacho, igual que en los archivos. Si ya los consultas, no necesitas llamarlo aparte. `date` es el instante en que se sirvió la respuesta, no una fecha del despacho.

```bash
curl "https://api-comex.eurus.pro/$EURUS_AGENCIA/v1/dispatch/123457?key=$EURUS_API_KEY&rut=$EURUS_RUT"
```

```json
{
  "date": "2026-01-31T22:04:31.000Z",
  "data": {
    "id": "123457",
    "estadoAforo": "Aforo Documental",
    "estadoDIN": "Aceptada",
    "referencia": "REF-2026-001",
    "tipoTramite": "IMPORTACION",
    "nombreAduana": "VALPARAISO",
    "consignante": "IMPORTADORA DEMO SPA",
    "fechaAceptacion": "2026-01-10T12:00:00.000Z",
    "fechaCorreccionBL": null,
    "valorCif": 15250.75,
    "valorFob": 13800,
    "...": "..."
  }
}
```

Las tres diferencias que siguen se refieren a `/status` y al listado.

## Tres diferencias con el módulo de Documentación

Los dos módulos comparten autenticación y el parámetro `rut`, pero su contrato de respuesta difiere en tres puntos que conviene no confundir.

### 1. Todas las claves están siempre presentes

En Documentación, un campo vacío **desaparece** del JSON. Acá es al revés: la respuesta trae siempre las trece claves, y las que no tienen valor se emiten como `null`.

```json
{
  "id": "123457",
  "numeroDespacho": "123457",
  "recordType": "din",
  "EstadoDIN": "ACEPTADA",
  "EstadoDUS": null,
  "isCompleted": false,
  "dueStatus": "EN_PLAZO",
  "priority": "ALTA",
  "allowEdit": true,
  "createdDate": "2026-01-05T13:00:00.000Z",
  "lastModifiedDate": "2026-01-18T09:10:00.000Z",
  "fechaEta": "2026-01-22T00:00:00.000Z",
  "fechaLegalizacion": null
}
```

### 2. No hay paginación por cursor

El listado se acota con `limit`, que admite hasta **200** y por defecto trae 50. No hay `nextToken`.

:::warning `total` no es el total existente
`total` es **la cantidad devuelta en esa respuesta**. Si viene igual a `limit`, es probable que haya más despachos de los que estás viendo: subí el `limit` o afiná los filtros.
:::

### 3. Los filtros toleran valores no soportados, pero no te apoyes en eso

Los valores soportados son los que declara la [Referencia de la API](../reference/api-comex-eurus-pro.info.mdx): `orderBy` dentro de su lista, `orderDirection` en `asc` o `desc`, y `limit` entre 1 y 200.

Hoy un valor fuera de ahí no produce error: se descarta y se aplica el valor por defecto. **Ese comportamiento no es parte del contrato** y puede pasar a responder `400` sin aviso previo, así que validá los filtros de tu lado en vez de confiar en el descarte silencioso.

## Parámetros comunes

| Parámetro | Ubicación | Descripción |
|---|---|---|
| `idAgencia` | Path (variable de servidor) | Identificador de tu agencia EURUS PRO®. |
| `key` | Query | API Key provista por EURUS PRO®. Ver [Autenticación](../authentication.md). |
| `rut` | Query | RUT del cliente final (ver [formato de RUT](../conventions.md#formato-de-rut)). **Acota lo que ves**: solo devuelve despachos de esa cuenta. |

Un despacho que pertenece a otro cliente responde `404`, igual que uno inexistente. Ver [Errores](../errors.md).
