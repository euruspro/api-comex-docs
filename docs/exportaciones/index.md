---
id: index
title: Exportaciones
slug: /exportaciones
description: Módulo de exportaciones de la API Comex de EURUS PRO.
---

# Exportaciones

Este módulo de la API Comex cubrirá las operaciones y consultas relacionadas con **operaciones de exportación** gestionadas por EURUS PRO.

:::info Próximamente
Los endpoints específicos de exportaciones estarán disponibles en una próxima iteración de la API. Actualmente, los documentos asociados a despachos de exportación se consultan mediante el módulo de [Documentación](../documentacion/index.md), que soporta tanto importaciones como exportaciones.
:::

## ¿Qué podrás hacer desde este módulo?

Una vez que los endpoints estén liberados, desde aquí podrás:

- Registrar y consultar operaciones de exportación.
- Obtener el detalle comercial, logístico y aduanero de cada embarque.
- Rastrear el ciclo de vida de un despacho (borrador → registrado → en trámite → embarcado → cerrado).
- Suscribirte a eventos de cambio de estado vía [webhooks](../webhooks.md).

## Mientras tanto

Puedes obtener los **documentos asociados a un despacho de exportación** (factura comercial, packing list, BL, certificado de origen, etc.) usando el módulo de [Documentación](../documentacion/index.md):

- [Consultar documentos de un despacho](../reference/listar-documentos-despacho.api.mdx)
- [Consultar documentos por tipo y rango de fechas](../reference/listar-documentos-por-tipo-y-fecha.api.mdx)
