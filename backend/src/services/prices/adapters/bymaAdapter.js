const axios = require('axios');

const BYMA_BASE = 'https://open.bymadata.com.ar/vanoms-be-core/rest/api/bymadata/free/bnown';

// Fallback para bonos y ONs que Yahoo Finance no tiene
const fetchPrice = async (ticker) => {
  const url = `${BYMA_BASE}/securities/bonds`;
  const { data } = await axios.get(url, { timeout: 8000 });

  const bonds = data?.content ?? data ?? [];
  const match = bonds.find(
    (b) => b.symbol?.toUpperCase() === ticker.toUpperCase()
  );

  if (!match) throw new Error(`BYMA: ticker ${ticker} no encontrado`);

  return {
    ticker,
    precio: match.price ?? match.settlementPrice ?? match.last,
    moneda: 'ARS',
    variacion_pct: match.changePercent ?? 0,
    mercado_abierto: true,
    fuente: 'byma',
  };
};

module.exports = { fetchPrice };
