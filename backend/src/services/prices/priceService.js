const yahooAdapter = require('./adapters/yahooAdapter');
const galileoAdapter = require('./adapters/galileoAdapter');
const bcraAdapter = require('./adapters/bcraAdapter');
const Price = require('../../models/price.model');
const PriceHistory = require('../../models/priceHistory.model');
const Portfolio = require('../../models/portfolio.model');

// Devuelve el adapter correcto según tipo_activo
const getAdapter = (tipo_activo) => {
  if (tipo_activo === 'FCI') return galileoAdapter;
  return yahooAdapter; // ACCION, CEDEAR, ADR, BONO, ON
};

// Obtiene todos los tickers únicos de portfolios activos con posiciones abiertas
const getActiveTickers = async () => {
  const portfolios = await Portfolio.find({ activo: true });
  const map = {};

  for (const p of portfolios) {
    for (const pos of p.positions) {
      if (pos.cantidad_actual > 0) {
        map[pos.ticker] = pos.tipo_activo;
      }
    }
  }

  return Object.entries(map).map(([ticker, tipo_activo]) => ({ ticker, tipo_activo }));
};

// Guarda o actualiza el precio actual y agrega al historial (una vez por día)
const persistPrice = async (result, tipoCambio) => {
  await Price.findOneAndUpdate(
    { ticker: result.ticker },
    { ...result, updated_at: new Date() },
    { upsert: true, returnDocument: 'after' }
  );

  // Solo guarda en historial si no hay registro para hoy
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const existe = await PriceHistory.findOne({ ticker: result.ticker, fecha: { $gte: hoy } });
  if (!existe) {
    await PriceHistory.create({
      ticker: result.ticker,
      fecha: new Date(),
      precio_cierre: result.precio,
      moneda: result.moneda,
      fuente: result.fuente,
      tipo_cambio_usd: tipoCambio?.oficial ?? null,
    });
  }
};

// Actualiza todos los precios activos — llamado por el endpoint y el cron
const updateAllPrices = async () => {
  const tickers = await getActiveTickers();
  if (tickers.length === 0) return { updated: 0, errors: [] };

  const tipoCambio = await bcraAdapter.fetchRates().catch(() => null);

  // Procesamos de a uno con delay para no saturar las APIs externas
  const results = [];
  for (const { ticker, tipo_activo } of tickers) {
    const result = await (async () => {
      try {
        const adapter = getAdapter(tipo_activo);
        const data = await adapter.fetchPrice(ticker, tipo_activo);
        await persistPrice(data, tipoCambio);
        return { status: 'fulfilled', value: ticker };
      } catch (err) {
        return { status: 'rejected', reason: err, ticker };
      }
    })();
    results.push(result);
    await new Promise((r) => setTimeout(r, 300)); // 300ms entre tickers
  }

  const updated = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  const errors = results
    .filter((r) => r.status === 'rejected')
    .map((r) => ({ ticker: r.ticker, error: r.reason?.message }));

  console.log(`[prices] Actualizado: ${updated.length} tickers. Errores: ${errors.length}`);
  if (errors.length) console.error('[prices] Errores:', errors);

  return { updated: updated.length, errors, tipo_cambio: tipoCambio };
};

module.exports = { updateAllPrices, getActiveTickers, persistPrice };
