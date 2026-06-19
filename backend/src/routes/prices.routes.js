const router = require('express').Router();
const Price = require('../models/price.model');
const PriceHistory = require('../models/priceHistory.model');
const { updateAllPrices, getActiveTickers, persistPrice } = require('../services/prices/priceService');
const { findFundId } = require('../services/prices/adapters/cafciAdapter');
const bcraAdapter = require('../services/prices/adapters/bcraAdapter');

// GET /api/prices — precios actuales de todos los tickers
router.get('/', async (req, res, next) => {
  try {
    const prices = await Price.find().sort({ ticker: 1 });
    res.json({ success: true, data: prices });
  } catch (err) {
    next(err);
  }
});

// GET /api/prices/tickers — tickers activos (para que el script externo sepa qué fetchear)
router.get('/tickers', async (req, res, next) => {
  try {
    const tickers = await getActiveTickers();
    res.json({ success: true, data: tickers });
  } catch (err) {
    next(err);
  }
});

// POST /api/prices/update — trigger manual de actualización
router.post('/update', async (req, res, next) => {
  try {
    const result = await updateAllPrices();
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// POST /api/prices/push — recibe precios pre-calculados desde GitHub Actions
// Requiere header: Authorization: Bearer <PRICES_PUSH_SECRET>
router.post('/push', async (req, res, next) => {
  try {
    const secret = process.env.PRICES_PUSH_SECRET;
    const auth = req.headers.authorization;
    if (!secret || auth !== `Bearer ${secret}`) {
      return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    const { prices } = req.body;
    if (!Array.isArray(prices) || prices.length === 0) {
      return res.status(400).json({ success: false, message: 'Campo prices[] requerido' });
    }

    const tipoCambio = await bcraAdapter.fetchRates().catch(() => null);

    const results = [];
    for (const p of prices) {
      try {
        await persistPrice(p, tipoCambio);
        results.push({ status: 'fulfilled', ticker: p.ticker });
      } catch (err) {
        results.push({ status: 'rejected', ticker: p.ticker, error: err.message });
      }
    }

    const updated = results.filter((r) => r.status === 'fulfilled').map((r) => r.ticker);
    const errors = results.filter((r) => r.status === 'rejected');

    console.log(`[push] Guardado: ${updated.length} precios. Errores: ${errors.length}`);
    res.json({ success: true, updated: updated.length, errors, tipo_cambio: tipoCambio });
  } catch (err) {
    next(err);
  }
});

// PUT /api/prices/:ticker — carga manual de precio (JWT asesor)
router.put('/:ticker', async (req, res, next) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    const { precio, moneda = 'ARS', variacion_pct = 0, fuente = 'manual' } = req.body;
    if (!precio || isNaN(precio))
      return res.status(400).json({ success: false, message: 'precio requerido' });
    const { persistPrice } = require('../services/prices/priceService');
    await persistPrice({ ticker, precio: Number(precio), moneda, variacion_pct: Number(variacion_pct), mercado_abierto: false, fuente });
    const price = await require('../models/price.model').findOne({ ticker });
    res.json({ success: true, data: price });
  } catch (err) { next(err); }
});

// GET /api/prices/cafci/search?nombre=galileo — helper para encontrar IDs de fondos
router.get('/cafci/search', async (req, res, next) => {
  try {
    if (!req.query.nombre) {
      return res.status(400).json({ success: false, message: 'Parámetro nombre requerido' });
    }
    const fondos = await findFundId(req.query.nombre);
    res.json({ success: true, data: fondos });
  } catch (err) {
    next(err);
  }
});

// GET /api/prices/:ticker — precio actual de un ticker (dinámico: va al final)
router.get('/:ticker', async (req, res, next) => {
  try {
    const price = await Price.findOne({ ticker: req.params.ticker.toUpperCase() });
    if (!price) return res.status(404).json({ success: false, message: 'Ticker no encontrado' });
    res.json({ success: true, data: price });
  } catch (err) {
    next(err);
  }
});

// GET /api/prices/:ticker/history?desde=fecha&hasta=fecha
router.get('/:ticker/history', async (req, res, next) => {
  try {
    const filter = { ticker: req.params.ticker.toUpperCase() };
    if (req.query.desde || req.query.hasta) {
      filter.fecha = {};
      if (req.query.desde) filter.fecha.$gte = new Date(req.query.desde);
      if (req.query.hasta) filter.fecha.$lte = new Date(req.query.hasta);
    }
    const history = await PriceHistory.find(filter).sort({ fecha: -1 });
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
