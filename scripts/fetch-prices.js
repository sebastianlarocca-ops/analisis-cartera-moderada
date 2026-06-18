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

const RAILWAY_URL = process.env.RAILWAY_URL?.replace(/\/$/, '');
const SECRET = process.env.PRICES_PUSH_SECRET;
const YAHOO_CHART = 'https://query1.finance.yahoo.com/v8/finance/chart';

const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
};

if (!RAILWAY_URL || !SECRET) {
  console.error('Faltan RAILWAY_URL o PRICES_PUSH_SECRET');
  process.exit(1);
}

const TIPOS_LOCALES = ['ACCION', 'CEDEAR', 'BONO', 'ON'];

const buildYahooSymbol = (ticker, tipo_activo) =>
  TIPOS_LOCALES.includes(tipo_activo) ? `${ticker}.BA` : ticker;

const fetchYahoo = async (ticker, tipo_activo) => {
  const symbol = buildYahooSymbol(ticker, tipo_activo);
  const { data } = await axios.get(`${YAHOO_CHART}/${symbol}`, {
    params: { interval: '1d', range: '1d' },
    headers: YAHOO_HEADERS,
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

  console.log(`Fetcheando ${tickers.length} tickers: ${tickers.map((t) => t.ticker).join(', ')}`);

  // 2. Fetchear precios de Yahoo secuencialmente con delay
  const prices = [];
  const errors = [];

  for (const { ticker, tipo_activo } of tickers) {
    if (tipo_activo === 'FCI') {
      console.log(`  [skip] ${ticker} (FCI — Railway lo fetchea directo de CAFCI)`);
      continue;
    }
    try {
      const price = await fetchYahoo(ticker, tipo_activo);
      prices.push(price);
      console.log(`  [ok] ${ticker}: ${price.precio} ${price.moneda}`);
    } catch (err) {
      errors.push({ ticker, error: err.message });
      console.error(`  [error] ${ticker}: ${err.message}`);
    }
    await sleep(400);
  }

  if (!prices.length) {
    console.error('Ningún precio obtenido. Abortando push.');
    process.exit(1);
  }

  // 3. Push a Railway
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
