import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import type * as OpenApiPlugin from 'docusaurus-plugin-openapi-docs';

const config: Config = {
  title: 'API Comex — EURUS PRO',
  tagline: 'Documentación pública para la API de Comercio Exterior',
  favicon: 'img/favicon.svg',

  url: 'https://docs.eurus.pro',
  baseUrl: '/',

  organizationName: 'euruspro',
  projectName: 'api-comex-docs',
  trailingSlash: false,

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    localeConfigs: {
      es: {label: 'Español', htmlLang: 'es-ES'},
      en: {label: 'English', htmlLang: 'en-US'},
    },
  },

  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid', 'docusaurus-theme-openapi-docs'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
          editUrl:
            'https://github.com/euruspro/api-comex-docs/edit/main/',
          docItemComponent: '@theme/ApiItem',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      'docusaurus-plugin-openapi-docs',
      {
        id: 'openapi',
        docsPluginId: 'classic',
        config: {
          comex: {
            specPath: 'openapi/comex.yaml',
            outputDir: 'docs/reference',
          } satisfies OpenApiPlugin.Options,
        } satisfies Record<string, OpenApiPlugin.Options>,
      },
    ],
  ],

  themeConfig: {
    image: 'img/social-card.png',
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'API Comex',
      logo: {
        alt: 'EURUS PRO',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'doc',
          docId: 'intro',
          position: 'left',
          label: 'Introducción',
        },
        {
          type: 'doc',
          docId: 'quickstart',
          position: 'left',
          label: 'Quickstart',
        },
        {
          type: 'dropdown',
          label: 'Módulos',
          position: 'left',
          items: [
            {label: 'Importaciones', to: '/docs/importaciones'},
            {label: 'Exportaciones', to: '/docs/exportaciones'},
            {label: 'Documentación', to: '/docs/documentacion'},
          ],
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
        {
          href: 'https://github.com/euruspro/api-comex-docs',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Primeros pasos',
          items: [
            {label: 'Introducción', to: '/docs/intro'},
            {label: 'Quickstart', to: '/docs/quickstart'},
            {label: 'Autenticación', to: '/docs/authentication'},
          ],
        },
        {
          title: 'Módulos',
          items: [
            {label: 'Importaciones', to: '/docs/importaciones'},
            {label: 'Exportaciones', to: '/docs/exportaciones'},
            {label: 'Documentación', to: '/docs/documentacion'},
          ],
        },
        {
          title: 'Recursos',
          items: [
            {label: 'Convenciones', to: '/docs/conventions'},
            {label: 'Errores', to: '/docs/errors'},
            {label: 'Webhooks', to: '/docs/webhooks'},
            {label: 'Changelog', to: '/docs/changelog'},
          ],
        },
        {
          title: 'Más',
          items: [
            {
              label: 'EURUS PRO',
              href: 'https://eurus.pro',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/euruspro/api-comex-docs',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} EURUS PRO. Construido con Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'python', 'yaml'],
    },
    languageTabs: [
      {
        highlight: 'bash',
        language: 'curl',
        logoClass: 'curl',
      },
      {
        highlight: 'javascript',
        language: 'nodejs',
        logoClass: 'nodejs',
      },
      {
        highlight: 'python',
        language: 'python',
        logoClass: 'python',
      },
    ],
  } satisfies Preset.ThemeConfig,
};

export default config;
