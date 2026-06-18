const router = require('express').Router();
const Portfolio = require('../models/portfolio.model');

// GET /api/portfolios?client_id=xxx
router.get('/', async (req, res, next) => {
  try {
    const filter = { activo: true };
    if (req.query.client_id) filter.client_id = req.query.client_id;
    const portfolios = await Portfolio.find(filter).populate('client_id', 'nombre apellido email');
    res.json({ success: true, data: portfolios });
  } catch (err) {
    next(err);
  }
});

// GET /api/portfolios/:id
router.get('/:id', async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id).populate(
      'client_id',
      'nombre apellido email perfil_riesgo'
    );
    if (!portfolio)
      return res.status(404).json({ success: false, message: 'Portfolio no encontrado' });
    res.json({ success: true, data: portfolio });
  } catch (err) {
    next(err);
  }
});

// POST /api/portfolios
router.post('/', async (req, res, next) => {
  try {
    const portfolio = await Portfolio.create(req.body);
    res.status(201).json({ success: true, data: portfolio });
  } catch (err) {
    next(err);
  }
});

// PUT /api/portfolios/:id  (solo metadata, nunca positions directamente)
router.put('/:id', async (req, res, next) => {
  try {
    const { positions, ...safeFields } = req.body;
    const portfolio = await Portfolio.findByIdAndUpdate(req.params.id, safeFields, {
      new: true,
      runValidators: true,
    });
    if (!portfolio)
      return res.status(404).json({ success: false, message: 'Portfolio no encontrado' });
    res.json({ success: true, data: portfolio });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/portfolios/:id  (soft delete)
router.delete('/:id', async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );
    if (!portfolio)
      return res.status(404).json({ success: false, message: 'Portfolio no encontrado' });
    res.json({ success: true, message: 'Portfolio desactivado' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
