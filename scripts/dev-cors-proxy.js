#!/usr/bin/env node
/**
 * Proxy CORS de desarrollo para la consola "Try it" del portal.
 *
 * ## Por qué existe
 *
 * El panel `ApiExplorer` de `docusaurus-theme-openapi-docs` ejecuta el request
 * desde el navegador. `api-comex.eurus.pro` no devuelve ningún header
 * `Access-Control-*` —corre en API Gateway, que no tiene CORS automático—, así
 * que el navegador descarta la respuesta aunque la API conteste 200. El panel
 * queda mudo y parece que "no se ejecuta".
 *
 * Este proxy se interpone: recibe la llamada desde el mismo origen que el sitio
 * de desarrollo, la reenvía a la API sin navegador de por medio, y devuelve la
 * respuesta con los headers CORS que faltan.
 *
 * ## Alcance: solo desarrollo local
 *
 * Escucha únicamente en 127.0.0.1. El sitio publicado en GitHub Pages NO puede
 * alcanzarlo: para que el panel funcione ahí hace falta un proxy con URL
 * pública, que además debe inyectar la API key del lado servidor en vez de
 * recibirla del navegador. Este script es el prototipo de ese componente, con
 * la inyección apagada.
 *
 * ## Forma del request
 *
 * El theme antepone la URL del proxy a la URL completa del destino
 * (`makeRequest.js`: `finalUrl = <proxy>/ + request.url`), así que acá llega:
 *
 *   GET /https://api-comex.eurus.pro/AG01/v1/master/file-types?key=...
 *
 * ## Uso
 *
 *   npm run dev:proxy                       # terminal 1
 *   OPENAPI_PROXY=http://127.0.0.1:8788 npm start   # terminal 2 (bash/zsh)
 *
 * En PowerShell: `$env:OPENAPI_PROXY = "http://127.0.0.1:8788"; npm start`
 *
 * @see docusaurus.config.ts — la opción `proxy` del plugin
 */

const http = require('node:http');

const HOST = '127.0.0.1';
const PORT = Number(process.env.DEV_PROXY_PORT ?? 8788);

/**
 * Lista blanca de hosts destino. Sin esto el script sería un proxy abierto en
 * la máquina de quien lo corra: cualquier página abierta en ese navegador
 * podría usarlo para alcanzar hosts internos saltándose la política de origen.
 */
const ALLOWED_HOSTS = (process.env.DEV_PROXY_ALLOW ?? 'api-comex.eurus.pro')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Expose-Headers': '*',
  'Access-Control-Max-Age': '600',
};

/**
 * Headers que no se reenvían: hop-by-hop, los que identifican al proxy como
 * origen, y los que `fetch` recalcula solo.
 */
const HEADERS_NO_REENVIADOS = new Set([
  'host', 'origin', 'referer', 'connection', 'keep-alive', 'upgrade',
  'proxy-authorization', 'proxy-authenticate', 'te', 'trailer',
  'transfer-encoding', 'content-length', 'accept-encoding',
]);

/** Headers de la respuesta que rompen si se copian: `fetch` ya descomprimió. */
const HEADERS_NO_COPIADOS = new Set([
  'content-encoding', 'content-length', 'transfer-encoding', 'connection',
]);

/**
 * Enmascara las credenciales de una URL para poder loguearla.
 * @param {URL} url
 * @returns {string}
 */
function redact(url) {
  const copia = new URL(url);
  for (const nombre of ['key', 'api_key', 'apikey', 'token']) {
    if (copia.searchParams.has(nombre)) copia.searchParams.set(nombre, '***');
  }
  return copia.toString();
}

/**
 * Extrae la URL de destino del path del request.
 * @param {string | undefined} reqUrl
 * @returns {{ ok: true, target: URL } | { ok: false, status: number, code: string, message: string }}
 */
function resolverDestino(reqUrl) {
  if (!reqUrl || reqUrl === '/') {
    return {
      ok: false, status: 400, code: 'PROXY_TARGET_UNDEFINED',
      message: 'Falta la URL de destino. Forma esperada: /https://<host>/<path>',
    };
  }

  // El parser de URL del navegador puede colapsar `https://` a `https:/`.
  const crudo = reqUrl.replace(/^\//, '').replace(/^(https?:)\/(?!\/)/, '$1//');

  let target;
  try {
    target = new URL(crudo);
  } catch {
    return {
      ok: false, status: 400, code: 'PROXY_TARGET_INVALID',
      message: `No es una URL absoluta: ${crudo}`,
    };
  }

  if (target.protocol !== 'https:' && target.protocol !== 'http:') {
    return {
      ok: false, status: 400, code: 'PROXY_PROTOCOL_INVALID',
      message: `Protocolo no soportado: ${target.protocol}`,
    };
  }

  if (!ALLOWED_HOSTS.includes(target.hostname)) {
    return {
      ok: false, status: 403, code: 'PROXY_HOST_NOT_ALLOWED',
      message: `Host no permitido: ${target.hostname}. Permitidos: ${ALLOWED_HOSTS.join(', ')}. `
        + 'Ampliar con DEV_PROXY_ALLOW=host1,host2',
    };
  }

  return { ok: true, target };
}

/**
 * Responde un error del proxy con el mismo formato que usa la API.
 * @param {http.ServerResponse} res
 * @param {number} status
 * @param {string} code
 * @param {string} message
 */
function responderError(res, status, code, message) {
  const cuerpo = JSON.stringify({ status, code, message });
  res.writeHead(status, {
    ...CORS_HEADERS,
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(cuerpo),
  });
  res.end(cuerpo);
}

/**
 * Acumula el cuerpo del request. Los GET del explorador no traen, pero el
 * proxy no asume el método.
 * @param {http.IncomingMessage} req
 * @returns {Promise<Buffer>}
 */
function leerCuerpo(req) {
  return new Promise((resolve, reject) => {
    const partes = [];
    req.on('data', (parte) => partes.push(parte));
    req.on('end', () => resolve(Buffer.concat(partes)));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // El preflight se responde acá y nunca se reenvía: en la pasarela cae bajo el
  // `security: api_key` global y devuelve 401 antes de llegar al backend.
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  const destino = resolverDestino(req.url);
  if (!destino.ok) {
    console.error(`[proxy] ${destino.code}: ${destino.message}`);
    responderError(res, destino.status, destino.code, destino.message);
    return;
  }

  const { target } = destino;
  const headers = {};
  for (const [nombre, valor] of Object.entries(req.headers)) {
    if (!HEADERS_NO_REENVIADOS.has(nombre.toLowerCase()) && typeof valor === 'string') {
      headers[nombre] = valor;
    }
  }

  const tieneCuerpo = req.method !== 'GET' && req.method !== 'HEAD';

  try {
    const cuerpo = tieneCuerpo ? await leerCuerpo(req) : undefined;
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      ...(cuerpo && cuerpo.length > 0 && { body: cuerpo }),
      redirect: 'manual',
    });

    const respuesta = Buffer.from(await upstream.arrayBuffer());
    const headersRespuesta = { ...CORS_HEADERS };
    upstream.headers.forEach((valor, nombre) => {
      if (!HEADERS_NO_COPIADOS.has(nombre.toLowerCase())) headersRespuesta[nombre] = valor;
    });

    console.log(`[proxy] ${req.method} ${redact(target)} -> ${upstream.status}`);
    res.writeHead(upstream.status, headersRespuesta);
    res.end(respuesta);
  } catch (error) {
    // La consola del navegador solo vería "failed to fetch": el motivo real
    // tiene que llegar al integrador en el cuerpo, no quedarse en esta terminal.
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[proxy] fallo al alcanzar ${redact(target)}: ${message}`);
    responderError(res, 502, 'PROXY_UPSTREAM_UNREACHABLE',
      `No se pudo alcanzar ${target.origin}: ${message}`);
  }
});

server.on('error', (error) => {
  const message = error.code === 'EADDRINUSE'
    ? `El puerto ${PORT} ya está en uso. Liberalo o usá DEV_PROXY_PORT=<otro>.`
    : `No se pudo iniciar el proxy: ${error.message}`;
  console.error(`Error: ${message}`);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`Proxy CORS de desarrollo en http://${HOST}:${PORT}`);
  console.log(`Hosts permitidos: ${ALLOWED_HOSTS.join(', ')}`);
  console.log('');
  console.log('En otra terminal, para que el panel "Try it" lo use:');
  console.log(`  OPENAPI_PROXY=http://${HOST}:${PORT} npm start`);
});
