const axios = require('axios');

// dolarapi.com — tipos de cambio actualizados
const DOLAR_API = 'https://dolarapi.com/v1/dolares';

const fetchRates = async () => {
  const { data } = await axios.get(DOLAR_API, { timeout: 8000 });

  const find = (nombre) =>
    data.find((d) => d.nombre?.toLowerCase().includes(nombre));

  const oficial = find('oficial');
  const mep = find('bolsa') ?? find('mep');
  const ccl = find('contado') ?? find('ccl');

  return {
    oficial: oficial?.venta ?? null,
    mep: mep?.venta ?? null,
    ccl: ccl?.venta ?? null,
    updated_at: new Date(),
  };
};

module.exports = { fetchRates };
