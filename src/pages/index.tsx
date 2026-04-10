import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Translate, {translate} from '@docusaurus/Translate';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary')}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">
          <Translate id="home.tagline">
            Documentación pública para integrar la API de Comercio Exterior de EURUS PRO.
          </Translate>
        </p>
        <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap'}}>
          <Link className="button button--secondary button--lg" to="/docs/quickstart">
            <Translate id="home.cta.quickstart">Empezar en 5 minutos</Translate>
          </Link>
          <Link className="button button--outline button--secondary button--lg" to="/docs/reference">
            <Translate id="home.cta.reference">Referencia de la API</Translate>
          </Link>
        </div>
      </div>
    </header>
  );
}

type Feature = {
  title: string;
  description: ReactNode;
};

function HomepageFeatures() {
  const features: Feature[] = [
    {
      title: translate({id: 'home.feature.rest.title', message: 'REST sobre HTTPS'}),
      description: (
        <Translate id="home.feature.rest.description">
          Endpoints JSON sobre HTTPS, gestionados por Google API Gateway con autenticación por API Key.
        </Translate>
      ),
    },
    {
      title: translate({id: 'home.feature.interactive.title', message: 'Prueba interactiva'}),
      description: (
        <Translate id="home.feature.interactive.description">
          Ejecuta llamadas contra la API directamente desde el navegador en cada página de referencia.
        </Translate>
      ),
    },
    {
      title: translate({id: 'home.feature.examples.title', message: 'Ejemplos listos'}),
      description: (
        <Translate id="home.feature.examples.description">
          Snippets en cURL, JavaScript (Node.js) y Python para cada endpoint documentado.
        </Translate>
      ),
    },
  ];

  return (
    <section className="features">
      <div className="container">
        <div className="row">
          {features.map((feature, idx) => (
            <div key={idx} className={clsx('col col--4')} style={{padding: '0.75rem'}}>
              <div className="featureCard">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description={siteConfig.tagline}
    >
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
