const axios = require('axios');
const https = require('https');

const BYMA_BASE =
  'https://open.bymadata.com.ar/vanoms-be-core/rest/api/bymadata/free/bnown/securities';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0',
  Accept: 'application/json',
};

// BYMA tiene un problema conocido con su cadena de certificados SSL
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// Cache en memoria para evitar múltiples llamadas en el mismo ciclo de actualización
let _cache = { equities: null, bonds: null, timestamp: 0 };
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

const getEquities = async () => {
  if (_cache.equities && Date.now() - _cache.timestamp < CACHE_TTL) return _cache.equities;
  const { data } = await axios.get(`${BYMA_BASE}/equities`, {
    headers: HEADERS,
    httpsAgent,
    timeout: 10000,
  });
  _cache.equities = data?.content ?? data ?? [];
  _cache.timestamp = Date.now();
  return _cache.equities;
};

const getBonds = async () => {
  if (_cache.bonds && Date.now() - _cache.timestamp < CACHE_TTL) return _cache.bonds;
  const { data } = await axios.get(`${BYMA_BASE}/bonds`, {
    headers: HEADERS,
    httpsAgent,
    timeout: 10000,
  });
  _cache.bonds = data?.content ?? data ?? [];
  _cache.timestamp = Date.now();
  return _cache.bonds;
};

const findInList = (list, ticker) =>
  list.find((item) => item.symbol?.toUpperCase() === ticker.toUpperCase());

const extractPrice = (item) => item?.price ?? item?.last ?? item?.settlementPrice ?? null;

const fetchPrice = async (ticker, tipo_activo) => {
  let item = null;

  if (tipo_activo === 'BONO' || tipo_activo === 'ON') {
    const bonds = await getBonds();
    item = findInList(bonds, ticker);
  } else {
    // ACCION, CEDEAR — busca primero en equities, luego en bonds como fallback
    const equities = await getEquities();
    item = findInList(equities, ticker);
    if (!item) {
      const bonds = await getBonds();
      item = findInList(bonds, ticker);
    }
  }

  if (!item) throw new Error(`BYMA: ticker "${ticker}" no encontrado`);

  const precio = extractPrice(item);
  if (precio == null) throw new Error(`BYMA: precio nulo para "${ticker}"`);

  return {
    ticker,
    precio,
    moneda: 'ARS',
    variacion_pct: item.changePercent ?? item.pctChange ?? 0,
    mercado_abierto: true,
    fuente: 'byma',
  };
};

module.exports = { fetchPrice };
