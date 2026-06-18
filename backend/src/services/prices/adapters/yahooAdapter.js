const axios = require('axios');

// Llama directamente a la API de Yahoo Finance sin usar el package yahoo-finance2
// El package fallaba en Railway (cloud IP). Axios con headers de browser funciona.
const YAHOO_CHART = 'https://query1.finance.yahoo.com/v8/finance/chart';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
};

// Tipos que cotizan en BYMA (ARS) → requieren sufijo .BA
const TIPOS_LOCALES = ['ACCION', 'CEDEAR', 'BONO', 'ON'];

const buildSymbol = (ticker, tipo_activo) => {
  if (TIPOS_LOCALES.includes(tipo_activo)) return `${ticker}.BA`;
  return ticker; // ADR cotiza en NYSE/NASDAQ sin sufijo
};

const fetchPrice = async (ticker, tipo_activo) => {
  const symbol = buildSymbol(ticker, tipo_activo);

  const { data } = await axios.get(`${YAHOO_CHART}/${symbol}`, {
    params: { interval: '1d', range: '1d' },
    headers: HEADERS,
    timeout: 10000,
  });

  const result = data?.chart?.result?.[0];
  const meta = result?.meta;

  if (!meta?.regularMarketPrice) {
    throw new Error(`Yahoo: sin precio para "${symbol}"`);
  }

  return {
    ticker,
    precio: meta.regularMarketPrice,
    moneda: tipo_activo === 'ADR' ? 'USD' : 'ARS',
    variacion_pct: meta.regularMarketChangePercent ?? 0,
    mercado_abierto: meta.marketState === 'REGULAR',
    fuente: 'yahoo',
  };
};

module.exports = { fetchPrice };
