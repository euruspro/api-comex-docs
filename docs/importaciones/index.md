---
id: index
title: Importaciones
slug: /importaciones
description: Módulo de importaciones de la API Comex de EURUS PRO.
---

# Importaciones

Este módulo de la API Comex cubrirá las operaciones y consultas relacionadas con **operaciones de importación** gestionadas por EURUS PRO.

:::info Próximamente
Los endpoints específicos de importaciones estarán disponibles en una próxima iteración de la API. Actualmente, los documentos asociados a despachos de importación se consultan mediante el módulo de [Documentación](../documentacion/index.md), que soporta tanto importaciones como exportaciones.
:::

## ¿Qué podrás hacer desde este módulo?

Una vez que los endpoints estén liberados, desde aquí podrás:

- Consultar el estado de operaciones de importación.
- Obtener el detalle comercial, logístico y aduanero de cada operación.
- Rastrear el ciclo de vida de un despacho (registrado → en trámite → aforado → retirado → cerrado).
- Suscribirte a eventos de cambio de estado vía [webhooks](../webhooks.md).

## Mientras tanto

Puedes obtener los **documentos asociados a un despacho de importación** usando el módulo de [Documentación](../documentacion/index.md):

- [Consultar documentos de un despacho](../reference/listar-documentos-despacho.api.mdx)
- [Consultar documentos por tipo y rango de fechas](../reference/listar-documentos-por-tipo-y-fecha.api.mdx)
