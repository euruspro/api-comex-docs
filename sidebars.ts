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
      collapsed: true,
      items: ['conventions', 'errors', 'webhooks'],
    },
    {
      type: 'category',
      label: 'Importaciones',
      collapsed: true,
      link: {type: 'doc', id: 'importaciones/index'},
      items: [],
    },
    {
      type: 'category',
      label: 'Exportaciones',
      collapsed: true,
      link: {type: 'doc', id: 'exportaciones/index'},
      items: [],
    },
    {
      type: 'category',
      label: 'Documentación',
      collapsed: false,
      link: {type: 'doc', id: 'documentacion/index'},
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
