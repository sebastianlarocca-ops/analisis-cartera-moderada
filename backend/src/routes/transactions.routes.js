const router = require('express').Router();
const Transaction = require('../models/transaction.model');
const Portfolio = require('../models/portfolio.model');

// Recalcula el snapshot de positions del portfolio a partir de todas sus transacciones
const recalcPositions = async (portfolio_id) => {
  const txs = await Transaction.find({ portfolio_id });

  const map = {};

  for (const tx of txs) {
    if (!map[tx.ticker]) {
      map[tx.ticker] = {
        ticker: tx.ticker,
        tipo_activo: tx.tipo_activo,
        moneda: tx.moneda,
        cantidad_actual: 0,
        precio_promedio_compra: 0,
        _costo_total: 0, // acumulador interno para el promedio ponderado
      };
    }

    const pos = map[tx.ticker];

    if (tx.tipo === 'COMPRA') {
      pos._costo_total += tx.precio * tx.cantidad;
      pos.cantidad_actual += tx.cantidad;
      pos.precio_promedio_compra = pos._costo_total / pos.cantidad_actual;
    } else if (tx.tipo === 'VENTA') {
      pos.cantidad_actual -= tx.cantidad;
      // El costo total se reduce proporcionalmente al precio promedio
      pos._costo_total = pos.precio_promedio_compra * pos.cantidad_actual;
    }
    // DIVIDENDO no afecta cantidad ni precio promedio
  }

  // Filtra posiciones con cantidad > 0 y limpia el acumulador interno
  const positions = Object.values(map)
    .filter((p) => p.cantidad_actual > 0)
    .map(({ _costo_total, ...pos }) => pos);

  await Portfolio.findByIdAndUpdate(portfolio_id, { positions });
  return positions;
};

// GET /api/transactions?portfolio_id=xxx&ticker=xxx&desde=fecha&hasta=fecha
router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.portfolio_id) filter.portfolio_id = req.query.portfolio_id;
    if (req.query.client_id) filter.client_id = req.query.client_id;
    if (req.query.ticker) filter.ticker = req.query.ticker.toUpperCase();
    if (req.query.tipo) filter.tipo = req.query.tipo.toUpperCase();
    if (req.query.desde || req.query.hasta) {
      filter.fecha = {};
      if (req.query.desde) filter.fecha.$gte = new Date(req.query.desde);
      if (req.query.hasta) filter.fecha.$lte = new Date(req.query.hasta);
    }

    const txs = await Transaction.find(filter).sort({ fecha: -1 });
    res.json({ success: true, data: txs });
  } catch (err) {
    next(err);
  }
});

// GET /api/transactions/:id
router.get('/:id', async (req, res, next) => {
  try {
    const tx = await Transaction.findById(req.params.id)
      .populate('client_id', 'nombre apellido')
      .populate('portfolio_id', 'nombre');
    if (!tx) return res.status(404).json({ success: false, message: 'Transacción no encontrada' });
    res.json({ success: true, data: tx });
  } catch (err) {
    next(err);
  }
});

// POST /api/transactions  — registra compra o venta y recalcula el portfolio
router.post('/', async (req, res, next) => {
  try {
    const tx = await Transaction.create(req.body);
    const positions = await recalcPositions(tx.portfolio_id);
    res.status(201).json({ success: true, data: tx, positions_actualizadas: positions });
  } catch (err) {
    next(err);
  }
});

// Las transacciones son inmutables: no hay PUT ni DELETE

module.exports = router;
