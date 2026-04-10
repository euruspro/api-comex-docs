---
id: index
title: Documentación
slug: /documentacion
description: Módulo de documentación — consulta documentos y archivos asociados a despachos.
---

# Documentación

El módulo de **Documentación** permite consultar los archivos y documentos asociados a despachos de comercio exterior gestionados por EURUS PRO: **facturas comerciales, packing lists, Bill of Lading, certificados de origen, certificados sanitarios** y cualquier otro documento adjunto a un despacho.

Este módulo aplica tanto a **importaciones** como a **exportaciones** — la API no distingue el tipo de operación en sus endpoints de consulta de archivos.

## Endpoints disponibles

Hay dos endpoints principales, ambos en la etiqueta **Documentación** de la [Referencia de la API](../reference):

1. **[`GET /dispatch/files/{numeroDespacho}`](../reference/listar-documentos-despacho.api.mdx)**
   Devuelve **todos los documentos** (o filtrados por `fileTypeName`) de un **despacho específico** del cliente.

2. **[`GET /dispatch/files`](../reference/listar-documentos-por-tipo-y-fecha.api.mdx)**
   Devuelve los documentos de **un tipo específico** (`fileTypeName`) emitidos en un **rango de fechas** para un cliente.

## Parámetros comunes

Todos los endpoints de este módulo requieren los siguientes parámetros obligatorios:

| Parámetro | Ubicación | Descripción |
|---|---|---|
| `idAgencia` | Path (variable de servidor) | Identificador de tu agencia EURUS PRO. Se asigna al provisionar el acceso. |
| `key` | Query | API Key provista por EURUS PRO. Ver [Autenticación](../authentication.md). |
| `rut` | Query | RUT del cliente final, **solo dígitos** (ver [formato de RUT](../conventions.md#formato-de-rut)). |

## Conceptos clave

### Despacho

Un **despacho** es la unidad operativa que agrupa todos los documentos de una operación de comercio exterior. Cada despacho tiene un **número** (`numeroDespacho`) asignado por EURUS PRO al momento de su creación.

### `fileTypeName`

Identifica el **tipo de documento** dentro de un despacho. Valores actualmente habilitados en la API:

| `fileTypeName` | Descripción |
|---|---|
| `FACTURA AGENCIA` | Factura emitida por la agencia EURUS PRO. |
| `FACTURA TERCEROS` | Factura emitida por terceros (navieras, transportistas, almacenes, etc.). |
| `NOTA DE COBRO` | Nota de cobro asociada al despacho. |
| `CERTIFICADO DE ORIGEN` | Certificado de origen de la mercancía. |
| `CONOCIMIENTO DE EMBARQUE (B/L)` | Bill of Lading / conocimiento de embarque marítimo. |

:::note
Nuevos `fileTypeName` se irán habilitando en la API a medida que se amplíe su cobertura. Los nuevos valores se anunciarán en el [Changelog](../changelog.md).
:::

:::warning URL encoding obligatorio
Los valores de `fileTypeName` contienen **espacios** y, en algunos casos, **paréntesis y barras**. Por eso **deben enviarse URL-encoded** en la query string:

| Valor | URL-encoded |
|---|---|
| `FACTURA AGENCIA` | `FACTURA%20AGENCIA` |
| `FACTURA TERCEROS` | `FACTURA%20TERCEROS` |
| `NOTA DE COBRO` | `NOTA%20DE%20COBRO` |
| `CERTIFICADO DE ORIGEN` | `CERTIFICADO%20DE%20ORIGEN` |
| `CONOCIMIENTO DE EMBARQUE (B/L)` | `CONOCIMIENTO%20DE%20EMBARQUE%20%28B%2FL%29` |

Si construyes la URL con helpers como `URLSearchParams` (JS), `params={}` (`httpx` / `requests` en Python) o `-d --data-urlencode` (cURL), **el encoding se hace automáticamente** y no tienes que preocuparte. El problema aparece solo si concatenas strings crudos.
:::

## Casos de uso comunes

### 1. Descargar todos los documentos de un despacho conocido

Si tu ERP registra un despacho y quiere adjuntar todos sus documentos:

```bash
curl "https://api-comex.eurus.pro/12345/v1/dispatch/files/DSP-2026-00123?key=$API_KEY&rut=765432101"
```

### 2. Extraer todas las facturas de agencia de un mes para conciliación contable

Para un proceso batch mensual — nota el `%20` en lugar del espacio:

```bash
curl "https://api-comex.eurus.pro/12345/v1/dispatch/files?key=$API_KEY&rut=765432101&startDate=2026-01-01&endDate=2026-01-31&fileTypeName=FACTURA%20AGENCIA"
```

O, de forma equivalente y más legible, con `--data-urlencode` de cURL:

```bash
curl -G "https://api-comex.eurus.pro/12345/v1/dispatch/files" \
  --data-urlencode "key=$API_KEY" \
  --data-urlencode "rut=765432101" \
  --data-urlencode "startDate=2026-01-01" \
  --data-urlencode "endDate=2026-01-31" \
  --data-urlencode "fileTypeName=FACTURA AGENCIA"
```

Consulta la [Referencia de la API](../reference) para ver todos los parámetros, esquemas de respuesta y ejemplos interactivos.
