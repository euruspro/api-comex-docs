import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import type * as OpenApiPlugin from 'docusaurus-plugin-openapi-docs';

const config: Config = {
  title: 'API Comex — EURUS PRO®',
  tagline: 'Documentación pública para la API de Comercio Exterior',
  favicon: 'img/favicon.svg',

  url: 'https://api-comex-docs.eurus.pro',
  baseUrl: '/',

  organizationName: 'euruspro',
  projectName: 'api-comex-docs',
  trailingSlash: false,

  // Un link roto es un error de contenido, no una advertencia: en 'warn' el
  // deploy publica páginas con referencias muertas sin que nadie lo note.
  onBrokenLinks: 'throw',

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
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
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
    // Sass plugin is a peer dependency of docusaurus-theme-openapi-docs v5.
    'docusaurus-plugin-sass',
    [
      'docusaurus-plugin-openapi-docs',
      {
        id: 'openapi',
        docsPluginId: 'classic',
        config: {
          comex: {
            specPath: 'openapi/comex.yaml',
            outputDir: 'docs/reference',
            /**
             * El botón "Send API Request" dispara un fetch desde el navegador
             * contra https://api-comex.eurus.pro. Esa llamada no puede
             * completarse hoy: la pasarela no devuelve ningún header
             * `Access-Control-*`, así que el navegador bloquea la lectura de la
             * respuesta aunque la API conteste 200. Verificado contra
             * producción, en GET y en preflight OPTIONS.
             *
             * Se oculta el botón en vez de abrir CORS en la pasarela: hacerlo
             * obligaría al integrador a pegar su API key en el navegador y
             * enviarla en la query string, donde queda en el historial, en los
             * logs del balanceador y al alcance de cualquier extensión.
             *
             * El arreglo previsto es un proxy de pruebas en el dominio del
             * portal que inyecte la key del lado servidor: resuelve el CORS por
             * mismo origen y la key nunca toca el navegador. Cuando exista,
             * quitar esta opción.
             */
            hideSendButton: true,
          } satisfies OpenApiPlugin.Options,
        } satisfies Record<string, OpenApiPlugin.Options>,
      },
    ],
    /**
     * Polyfill Node built-ins required by `postman-code-generators`
     * (transitive dependency of docusaurus-theme-openapi-docs, used to
     * render the language tabs in the "Try it" console). Webpack 5 no
     * longer bundles Node core modules by default, so we point `path`
     * to `path-browserify` (already pulled in as a transitive dep).
     */
    function nodePolyfillsPlugin() {
      return {
        name: 'node-polyfills',
        configureWebpack() {
          return {
            resolve: {
              fallback: {
                path: require.resolve('path-browserify'),
                fs: false,
                module: false,
                os: false,
                crypto: false,
              },
            },
          };
        },
      };
    },
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
        alt: 'EURUS PRO®',
        src: 'img/logo.svg',
        srcDark: 'img/logo-dark.svg',
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
              label: 'EURUS PRO®',
              href: 'https://eurus.pro',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/euruspro/api-comex-docs',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} EURUS PRO®. Construido con Docusaurus.`,
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
