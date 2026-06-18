const axios = require('axios');

const TWELVE_BASE = 'https://api.twelvedata.com';

// Tipos que cotizan en BYMA (ARS) → especificamos exchange para evitar ambigüedades
const TIPOS_BYMA = ['ACCION', 'CEDEAR', 'BONO', 'ON'];

const fetchPrice = async (ticker, tipo_activo) => {
  const params = {
    symbol: ticker,
    apikey: process.env.TWELVE_DATA_KEY,
  };

  if (TIPOS_BYMA.includes(tipo_activo)) {
    params.exchange = 'BYMA';
  }

  const { data } = await axios.get(`${TWELVE_BASE}/quote`, {
    params,
    timeout: 10000,
  });

  if (data.status === 'error') {
    throw new Error(`Twelve Data: ${data.message}`);
  }

  const precio = parseFloat(data.close);
  if (isNaN(precio)) throw new Error(`Twelve Data: precio inválido para "${ticker}"`);

  return {
    ticker,
    precio,
    moneda: tipo_activo === 'ADR' ? 'USD' : 'ARS',
    variacion_pct: parseFloat(data.percent_change ?? 0),
    mercado_abierto: data.is_market_open ?? false,
    fuente: 'twelvedata',
  };
};

module.exports = { fetchPrice };
