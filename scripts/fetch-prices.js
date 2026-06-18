#!/usr/bin/env node
/**
 * Fetches market prices from Yahoo Finance and pushes them to Railway.
 * Runs from GitHub Actions (IPs not blocked by Yahoo).
 *
 * Required env vars:
 *   RAILWAY_URL          — e.g. https://tu-app.up.railway.app
 *   PRICES_PUSH_SECRET   — shared secret with Railway backend
 */

const axios = require('axios');
const https = require('https');

const RAILWAY_URL = process.env.RAILWAY_URL?.replace(/\/$/, '').trim();
const SECRET = process.env.PRICES_PUSH_SECRET?.trim();

if (!RAILWAY_URL || !SECRET) {
  console.error('Faltan RAILWAY_URL o PRICES_PUSH_SECRET');
  process.exit(1);
}

const TIPOS_LOCALES = ['ACCION', 'CEDEAR', 'BONO', 'ON'];

const buildYahooSymbol = (ticker, tipo_activo) =>
  TIPOS_LOCALES.includes(tipo_activo) ? `${ticker}.BA` : ticker;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Obtiene cookie + crumb necesarios para llamar a la API de Yahoo Finance
const getYahooCrumb = async () => {
  // Paso 1: visitar finance.yahoo.com para obtener cookies de sesión
  const homeRes = await axios.get('https://finance.yahoo.com/', {
    headers: { 'User-Agent': UA, Accept: 'text/html' },
    timeout: 15000,
    maxRedirects: 5,
  });

  const setCookie = homeRes.headers['set-cookie'] || [];
  const cookie = setCookie.map((c) => c.split(';')[0]).join('; ');

  if (!cookie) throw new Error('Yahoo no devolvió cookies de sesión');

  // Paso 2: obtener crumb con esas cookies
  const crumbRes = await axios.get('https://query1.finance.yahoo.com/v1/test/getcrumb', {
    headers: { 'User-Agent': UA, Accept: '*/*', Cookie: cookie },
    timeout: 10000,
  });

  const crumb = crumbRes.data;
  if (!crumb || typeof crumb !== 'string' || crumb.includes('<') || crumb.length > 20) {
    throw new Error(`Crumb inválido: ${JSON.stringify(crumb).slice(0, 100)}`);
  }

  console.log('  Yahoo crumb obtenido.');
  return { cookie, crumb };
};

const fetchYahoo = async (ticker, tipo_activo, cookie, crumb) => {
  const symbol = buildYahooSymbol(ticker, tipo_activo);

  const { data } = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
    params: { interval: '1d', range: '1d', crumb },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      Cookie: cookie,
    },
    timeout: 10000,
  });

  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta?.regularMarketPrice) throw new Error(`Yahoo: sin precio para "${symbol}"`);

  return {
    ticker,
    precio: meta.regularMarketPrice,
    moneda: tipo_activo === 'ADR' ? 'USD' : 'ARS',
    variacion_pct: meta.regularMarketChangePercent ?? 0,
    mercado_abierto: meta.marketState === 'REGULAR',
    fuente: 'yahoo',
  };
};

const run = async () => {
  // 1. Obtener tickers activos desde Railway
  console.log(`Obteniendo tickers desde ${RAILWAY_URL}/api/prices/tickers ...`);
  const { data: tickersRes } = await axios.get(`${RAILWAY_URL}/api/prices/tickers`, {
    timeout: 10000,
  });
  const tickers = tickersRes.data;

  if (!tickers.length) {
    console.log('No hay tickers activos. Saliendo.');
    return;
  }

  const tickersTofetch = tickers.filter((t) => t.tipo_activo !== 'FCI');
  console.log(`Fetcheando ${tickersTofetch.length} tickers: ${tickersTofetch.map((t) => t.ticker).join(', ')}`);

  // 2. Obtener crumb de Yahoo (una sola vez para todos los tickers)
  console.log('Obteniendo sesión de Yahoo Finance...');
  const { cookie, crumb } = await getYahooCrumb();

  // 3. Fetchear precios secuencialmente con delay
  const prices = [];
  const errors = [];

  for (const { ticker, tipo_activo } of tickersTofetch) {
    try {
      const price = await fetchYahoo(ticker, tipo_activo, cookie, crumb);
      prices.push(price);
      console.log(`  [ok] ${ticker}: ${price.precio} ${price.moneda}`);
    } catch (err) {
      errors.push({ ticker, error: err.message });
      console.error(`  [error] ${ticker}: ${err.message}`);
    }
    await sleep(500);
  }

  if (!prices.length) {
    console.error('Ningún precio obtenido. Abortando push.');
    process.exit(1);
  }

  // 4. Push a Railway
  console.log(`\nPusheando ${prices.length} precios a Railway...`);
  const { data: pushRes } = await axios.post(
    `${RAILWAY_URL}/api/prices/push`,
    { prices },
    {
      headers: {
        Authorization: `Bearer ${SECRET}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    }
  );

  console.log(`Guardado: ${pushRes.updated} precios.`);
  if (pushRes.tipo_cambio) {
    console.log(`Tipo de cambio: oficial=${pushRes.tipo_cambio.oficial} MEP=${pushRes.tipo_cambio.mep}`);
  }
  if (pushRes.errors?.length) {
    console.error('Errores al guardar:', pushRes.errors);
  }
  if (errors.length) {
    console.error('Errores al fetchear:', errors);
    process.exit(1);
  }
};

run().catch((err) => {
  console.error('Error fatal:', err.message);
  process.exit(1);
});
