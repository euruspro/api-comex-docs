---
id: intro
title: Introducción
sidebar_position: 1
slug: /intro
description: Visión general de la API Comex de EURUS PRO, su alcance y conceptos clave.
---

# API Comex — EURUS PRO

Bienvenido a la documentación pública de la **API Comex de EURUS PRO**, una API REST para integrar sistemas externos con los procesos de **comercio exterior** gestionados por EURUS PRO: registro de operaciones de exportación, emisión y consulta de documentación comercial, certificados y seguimiento.

:::info Audiencia
Esta documentación está dirigida a **equipos técnicos** que vayan a integrar un sistema (ERP, TMS, portal propio, middleware, script interno) con los servicios de EURUS PRO. Se asume conocimiento básico de HTTP, JSON y consumo de APIs REST.
:::

## Qué puedes hacer con la API Comex

Con esta API puedes, entre otras cosas:

- **Registrar operaciones de comercio exterior** (exportaciones), con sus datos comerciales, incoterms, partidas arancelarias e ítems.
- **Consultar el estado** de una operación a lo largo de su ciclo de vida (borrador, registrada, en trámite, despachada, cerrada).
- **Obtener los documentos y certificados** asociados a una operación: factura comercial, packing list, Bill of Lading, certificado de origen, certificados sanitarios, etc.
- **Recibir eventos vía webhooks** cuando cambia el estado de una operación o se emite un nuevo documento.

## Conceptos clave

| Concepto | Descripción |
|---|---|
| **Operación** | Unidad principal del sistema. Representa una exportación con sus datos comerciales, logísticos y documentales. Tiene un ciclo de vida y un estado. |
| **Ítem** | Línea de producto dentro de una operación, con su descripción, partida arancelaria (HS code), cantidad y valor. |
| **Documento** | Cualquier pieza documental asociada a una operación: factura, packing list, BL, certificado de origen, etc. |
| **Certificado** | Subtipo de documento emitido por una entidad externa (ej. certificado de origen, certificado fitosanitario). |
| **Webhook** | Notificación HTTP POST que EURUS PRO envía a tu sistema cuando ocurre un evento relevante. |

## Arquitectura técnica

La API Comex se expone a través de **Google Cloud API Gateway**, lo que tiene un par de implicancias importantes para tu integración:

- **Todas las llamadas usan HTTPS**. No se acepta HTTP plano.
- **La autenticación se realiza mediante un API Key enviado como parámetro de query** (`?key=<API_KEY>`), no como header `Authorization`. Esto es específico del modelo de Google API Gateway. Ver [Autenticación](./authentication.md) para más detalles.
- Los endpoints están versionados con el prefijo `/v1`.

## Base URL

```
https://api.euruspro.com/comex/v1
```

:::note Placeholder
La URL anterior es el valor provisional publicado en esta versión de la documentación. Será confirmada por EURUS PRO antes del lanzamiento oficial.
:::

## Próximos pasos

1. Lee la [guía de Quickstart](./quickstart.md) para hacer tu primera llamada en menos de 5 minutos.
2. Revisa la sección de [Autenticación](./authentication.md) para entender cómo obtener y gestionar tu API Key.
3. Consulta las [Convenciones](./conventions.md) para conocer los formatos de request, paginación, errores y versionado.
4. Explora la [Referencia de endpoints](./reference) con ejemplos interactivos que puedes ejecutar desde el navegador.
