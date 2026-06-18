const axios = require('axios');

const CAFCI_BASE = 'https://api.cafci.org.ar';

// Mapa de ticker interno → ID de fondo en CAFCI
// Para encontrar el ID de un fondo nuevo: GET /fondo?nombre=<nombre>
const FUND_IDS = {
  GALMS: null, // Galileo Multi Strategy — completar con el ID real
};

// Busca el ID de un fondo por nombre (útil para setup inicial)
const findFundId = async (nombre) => {
  const { data } = await axios.get(`${CAFCI_BASE}/fondo`, {
    params: { nombre, limit: 5 },
    timeout: 8000,
  });
  return data?.data ?? data ?? [];
};

const fetchPrice = async (ticker) => {
  const fundId = FUND_IDS[ticker.toUpperCase()];

  if (!fundId) {
    throw new Error(
      `CAFCI: ID del fondo "${ticker}" no configurado. Buscar con findFundId() y completar FUND_IDS.`
    );
  }

  const hoy = new Date().toISOString().split('T')[0];
  const { data } = await axios.get(`${CAFCI_BASE}/fondo/${fundId}/cuotaparte`, {
    params: { fecha: hoy },
    timeout: 8000,
  });

  const cuotaparte = data?.data?.[0]?.vcp ?? data?.[0]?.vcp;
  if (!cuotaparte) throw new Error(`CAFCI: sin cuotaparte para ${ticker}`);

  return {
    ticker,
    precio: parseFloat(cuotaparte),
    moneda: 'ARS',
    variacion_pct: 0, // CAFCI no devuelve variación directa
    mercado_abierto: false, // FCIs no tienen mercado abierto/cerrado
    fuente: 'cafci',
  };
};

module.exports = { fetchPrice, findFundId };
