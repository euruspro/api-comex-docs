---
id: index
title: Desembolsos
slug: /desembolsos
description: Módulo de desembolsos — gastos pagados por la agencia por cuenta del cliente, por despacho.
---

# Desembolsos

El módulo de **Desembolsos** permite consultar los gastos que la agencia pagó por cuenta del cliente en un despacho —fletes, almacenaje, derechos, servicios de terceros—, con su estado, sus montos y los documentos que los respaldan.

## Endpoint disponible

En la etiqueta **Desembolsos** de la [Referencia de la API](../reference/api-comex-eurus-pro.info.mdx):

**[`GET /dispatch/{numeroDespacho}/desembolsos`](../reference/listar-desembolsos-despacho.api.mdx)**
Todos los desembolsos de un **despacho específico** del cliente.

```bash
curl "https://api-comex.eurus.pro/$EURUS_AGENCIA/v1/dispatch/123457/desembolsos?key=$EURUS_API_KEY&rut=$EURUS_RUT"
```

## Parámetros

| Parámetro | Ubicación | Descripción |
|---|---|---|
| `idAgencia` | Path (variable de servidor) | Identificador de tu agencia EURUS PRO®. |
| `numeroDespacho` | Path | Número del despacho. |
| `key` | Query | API Key provista por EURUS PRO®. Ver [Autenticación](../authentication.md). |
| `rut` | Query | RUT del cliente final (ver [formato de RUT](../conventions.md#formato-de-rut)). **Acota lo que ves**: el despacho tiene que ser de esa cuenta. |

Un despacho que pertenece a otro cliente responde `404`, igual que uno inexistente. Ver [Errores](../errors.md).

## Tres reglas de presencia

Este módulo tiene su propio criterio para los datos que faltan, distinto del de Documentación (que elimina las claves vacías) y del de Seguimiento (que emite todo como `null`).

### 1. Los opcionales se omiten

Los montos (`debe`, `monto`, `montoIva`, `montoNeto`, `saldo`), `fechaFacturado`, `invoiceInfo` y `documentInfo` **no aparecen** si no hay dato.

:::warning Un monto ausente no es un cero
Antes de sumar, verifica que la clave exista. Tratar un `monto` ausente como `0` subestima el total sin ninguna señal.

```javascript
const totalPagado = data
  .filter((d) => typeof d.monto === 'number')
  .reduce((acc, d) => acc + d.monto, 0);
```
:::

### 2. Los obligatorios de texto vienen como `""`

`codigoAnalisis`, `numeroDespacho`, `nombreAnalisis`, `numeroDocumento` y `estado` están **siempre**. Si no hay dato, vienen como `""`.

### 3. Fechas y montos obligatorios vienen como `null`

`fechaDesembolso` y, dentro de `dispatch`, todas las fechas y montos están siempre, y son `null` cuando no hay dato. Nunca `0` ni `""`: un `valorCif: 0` se confundiría con un valor real.

## El despacho en cada elemento

Cada desembolso trae el despacho asociado en `dispatch`: estados de aforo y de la DIN, fechas del ciclo aduanero (aceptación, arribo, retiro, pago de derechos) y valores (CIF, FOB, flete, seguro). Es el mismo objeto en todos los elementos de la respuesta.

## Orden y volumen

- **Orden cronológico** por `fechaDesembolso`. Los que no tienen fecha van al final.
- **Sin paginación**: la respuesta trae todos los desembolsos del despacho, y `total` es su cantidad.

## Los documentos de respaldo

`invoiceInfo` (la factura) y `documentInfo` (otro comprobante) comparten forma. Sus campos de texto se omiten si no hay dato, pero `totals` está **siempre**, aunque venga vacío:

```json
"invoiceInfo": {
  "fechaDocumento": "2026-01-15T00:00:00.000Z",
  "idProveedor": "76501137-K",
  "name": "FACTURA",
  "nombreProveedor": "NAVIERA DEMO SPA",
  "totals": { "neto": 1000, "iva": 190, "total": 1190 }
}
```

Las claves de `totals` dependen del documento: no asumas un conjunto fijo.
