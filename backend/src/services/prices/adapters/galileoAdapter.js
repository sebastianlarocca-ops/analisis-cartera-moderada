const axios = require('axios');

const GALILEO_API = 'https://www.galileoargentina.com.ar/api/fondos';

// Mapa ticker interno → abreviación exacta en la API de Galileo
const TICKER_MAP = {
  GALMS: 'GAMS',   // Galileo MultiStrategy
  GALMS2: 'GAMSY', // Galileo MultiStrategy II (USD)
};

let cache = null;
let cacheTs = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 min

const getFondos = async () => {
  if (cache && Date.now() - cacheTs < CACHE_TTL) return cache;
  const { data } = await axios.get(GALILEO_API, { timeout: 10000 });
  cache = data?.items ?? [];
  cacheTs = Date.now();
  return cache;
};

const fetchPrice = async (ticker) => {
  const abrev = TICKER_MAP[ticker.toUpperCase()];
  if (!abrev) throw new Error(`Galileo: ticker "${ticker}" no mapeado en TICKER_MAP`);

  const fondos = await getFondos();
  const fondo = fondos.find((f) => f.fields?.abreviacin === abrev);

  if (!fondo) throw new Error(`Galileo: fondo con abreviación "${abrev}" no encontrado`);

  const fields = fondo.fields;
  const precio = parseFloat(fields.cuotaparte);
  const anterior = parseFloat(fields.cuotaparteAnterior ?? fields.cuotaparte);

  if (isNaN(precio)) throw new Error(`Galileo: cuotaparte inválida para "${abrev}"`);

  const variacion_pct = anterior ? ((precio - anterior) / anterior) * 100 : 0;
  const moneda = fields.moneda?.toLowerCase().includes('dolar') ? 'USD' : 'ARS';

  return {
    ticker,
    precio,
    moneda,
    variacion_pct: Math.round(variacion_pct * 100) / 100,
    mercado_abierto: false,
    fuente: 'galileo',
  };
};

module.exports = { fetchPrice };
