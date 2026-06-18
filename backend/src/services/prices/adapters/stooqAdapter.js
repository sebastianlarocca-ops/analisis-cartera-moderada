const axios = require('axios');

// Stooq.com — fuente gratuita sin auth, cubre BYMA y NYSE/NASDAQ
// Formato símbolo:
//   Acciones AR / CEDEARs: ggal.ba, aapl.ba
//   ADRs USD:              ggal.us, ypf.us
//   Bonos AR:              al30.ba, gd30.ba

const STOOQ_URL = 'https://stooq.com/q/l/';

// Tipos que cotizan en ARS en BYMA → sufijo .ba
const TIPOS_LOCALES = ['ACCION', 'CEDEAR', 'BONO', 'ON'];

const buildSymbol = (ticker, tipo_activo) => {
  if (TIPOS_LOCALES.includes(tipo_activo)) return `${ticker.toLowerCase()}.ba`;
  return `${ticker.toLowerCase()}.us`; // ADR en NYSE/NASDAQ
};

const fetchPrice = async (ticker, tipo_activo) => {
  const symbol = buildSymbol(ticker, tipo_activo);

  // f=l1c1p2 → último precio, cambio absoluto, cambio porcentual
  const { data } = await axios.get(STOOQ_URL, {
    params: { s: symbol, f: 'l1c1p2', e: 'json' },
    timeout: 8000,
  });

  // Stooq devuelve { symbols: [{ symbol, close, change, percent_change }] }
  const item = data?.symbols?.[0];
  if (!item || !item.close || item.close === 'N/D') {
    throw new Error(`Stooq: sin datos para "${symbol}"`);
  }

  const precio = parseFloat(item.close);
  if (isNaN(precio)) throw new Error(`Stooq: precio inválido para "${symbol}"`);

  return {
    ticker,
    precio,
    moneda: tipo_activo === 'ADR' ? 'USD' : 'ARS',
    variacion_pct: parseFloat(item.percent_change ?? 0),
    mercado_abierto: true,
    fuente: 'stooq',
  };
};

module.exports = { fetchPrice };
