const router = require('express').Router();
const Price = require('../models/price.model');
const PriceHistory = require('../models/priceHistory.model');
const { updateAllPrices } = require('../services/prices/priceService');
const { findFundId } = require('../services/prices/adapters/cafciAdapter');

// GET /api/prices — precios actuales de todos los tickers
router.get('/', async (req, res, next) => {
  try {
    const prices = await Price.find().sort({ ticker: 1 });
    res.json({ success: true, data: prices });
  } catch (err) {
    next(err);
  }
});

// GET /api/prices/:ticker — precio actual de un ticker
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

// POST /api/prices/update — trigger manual de actualización
router.post('/update', async (req, res, next) => {
  try {
    const result = await updateAllPrices();
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
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

module.exports = router;
