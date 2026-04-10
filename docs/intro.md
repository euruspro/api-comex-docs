---
id: intro
title: Introducción
sidebar_position: 1
slug: /intro
description: Visión general de la API Comex de EURUS PRO, su alcance y conceptos clave.
---

# API Comex — EURUS PRO

Bienvenido a la documentación pública de la **API Comex de EURUS PRO**, una API REST para integrar sistemas externos con los procesos de **comercio exterior** gestionados por EURUS PRO: consulta de operaciones de importación y exportación, y acceso a los documentos y certificados asociados a cada despacho.

:::info Audiencia
Esta documentación está dirigida a **equipos técnicos** que vayan a integrar un sistema (ERP, TMS, portal propio, middleware, script interno) con los servicios de EURUS PRO. Se asume conocimiento básico de HTTP, JSON y consumo de APIs REST.
:::

## Módulos de la API

En su etapa inicial, la API Comex expone **tres módulos funcionales**:

| Módulo | Descripción | Estado |
|---|---|---|
| **[Importaciones](./importaciones/index.md)** | Consulta y gestión de operaciones de importación. | Próximamente |
| **[Exportaciones](./exportaciones/index.md)** | Consulta y gestión de operaciones de exportación. | Próximamente |
| **[Documentación](./documentacion/index.md)** | Consulta de archivos y documentos asociados a despachos (facturas, packing list, BL, certificados, etc.). | **Disponible** |

## Conceptos clave

| Concepto | Descripción |
|---|---|
| **Agencia** | Unidad de EURUS PRO que gestiona las operaciones de sus clientes. Cada agencia tiene un `idAgencia` único que forma parte del path de todas las llamadas. |
| **Cliente** | Organización final (importador/exportador) identificada por su **RUT**. Cada llamada requiere el parámetro `rut`. |
| **Despacho** | Unidad operativa que agrupa los documentos de una operación de comercio exterior. Identificado por un `numeroDespacho`. |
| **Documento** | Archivo asociado a un despacho: factura comercial, packing list, BL, certificado de origen, certificado fitosanitario, etc. Se identifican por su `fileTypeName`. |

## Arquitectura técnica

La API Comex se expone a través de **Google Cloud API Gateway**, lo que tiene un par de implicancias importantes para tu integración:

- **Todas las llamadas usan HTTPS**. No se acepta HTTP plano.
- **La autenticación se realiza mediante un API Key enviado como parámetro de query** (`?key=<API_KEY>`), no como header `Authorization`. Esto es específico del modelo de Google API Gateway. Ver [Autenticación](./authentication.md) para más detalles.
- **El `idAgencia` forma parte del path** (antes del segmento `/v1`) y se asigna al provisionar el acceso.
- **El `rut` del cliente** se envía como query parameter en cada llamada, en formato solo-dígitos. Ver [Convenciones → Formato de RUT](./conventions.md#formato-de-rut).

## Base URL

```
https://api-comex.eurus.pro/{idAgencia}/v1
```

El `{idAgencia}` es tu identificador de agencia asignado por EURUS PRO. Por ejemplo, si tu agencia tiene el ID `12345`, la URL base real será:

```
https://api-comex.eurus.pro/12345/v1
```

## Próximos pasos

1. Lee la [guía de Quickstart](./quickstart.md) para hacer tu primera llamada en menos de 5 minutos.
2. Revisa la sección de [Autenticación](./authentication.md) para entender cómo obtener y gestionar tu API Key.
3. Consulta las [Convenciones](./conventions.md) para conocer los formatos de request, RUT, paginación y errores.
4. Explora el módulo de [Documentación](./documentacion/index.md) — el único disponible en esta etapa inicial — con sus 2 endpoints interactivos.
