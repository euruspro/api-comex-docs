import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';
import openapiSidebar from './docs/reference/sidebar';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'category',
      label: 'Primeros pasos',
      collapsed: false,
      items: ['intro', 'quickstart', 'authentication'],
    },
    {
      type: 'category',
      label: 'Guías técnicas',
      collapsed: false,
      items: ['conventions', 'webhooks', 'errors'],
    },
    {
      type: 'category',
      label: 'Referencia de la API',
      collapsed: false,
      link: {
        type: 'generated-index',
        title: 'Referencia de la API',
        description:
          'Listado completo de endpoints de la API Comex de EURUS PRO con ejemplos interactivos.',
        slug: '/reference',
      },
      items: openapiSidebar as any,
    },
    {
      type: 'doc',
      id: 'changelog',
      label: 'Changelog',
    },
  ],
};

export default sidebars;
