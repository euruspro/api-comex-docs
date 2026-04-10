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

Identifica el **tipo de documento** dentro de un despacho. Algunos valores típicos:

| `fileTypeName` | Descripción |
|---|---|
| `FACTURA` | Factura comercial. |
| `PACKING_LIST` | Lista de contenido / packing list. |
| `BILL_OF_LADING` | Bill of Lading / conocimiento de embarque. |
| `CERTIFICADO_ORIGEN` | Certificado de origen. |
| `CERTIFICADO_FITOSANITARIO` | Certificado fitosanitario. |

:::note
El listado completo de `fileTypeName` soportados depende de la configuración de tu agencia. Consulta con EURUS PRO los valores exactos habilitados para tu cuenta.
:::

## Casos de uso comunes

### 1. Descargar todos los documentos de un despacho conocido

Si tu ERP registra un despacho y quiere adjuntar todos sus documentos:

```bash
curl "https://api-comex.eurus.pro/12345/v1/dispatch/files/DSP-2026-00123?key=$API_KEY&rut=765432101"
```

### 2. Extraer todas las facturas de un mes para conciliación contable

Para un proceso batch mensual:

```bash
curl "https://api-comex.eurus.pro/12345/v1/dispatch/files?key=$API_KEY&rut=765432101&startDate=2026-01-01&endDate=2026-01-31&fileTypeName=FACTURA"
```

Consulta la [Referencia de la API](../reference) para ver todos los parámetros, esquemas de respuesta y ejemplos interactivos.
