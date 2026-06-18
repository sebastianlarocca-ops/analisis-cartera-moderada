const router = require('express').Router();
const Client = require('../models/client.model');

// GET /api/clients
router.get('/', async (req, res, next) => {
  try {
    const clients = await Client.find({ activo: true }).sort({ apellido: 1, nombre: 1 });
    res.json({ success: true, data: clients });
  } catch (err) {
    next(err);
  }
});

// GET /api/clients/:id
router.get('/:id', async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    res.json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
});

// POST /api/clients
router.post('/', async (req, res, next) => {
  try {
    const client = await Client.create(req.body);
    res.status(201).json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
});

// PUT /api/clients/:id
router.put('/:id', async (req, res, next) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!client) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    res.json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/clients/:id  (soft delete)
router.delete('/:id', async (req, res, next) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, { activo: false }, { new: true });
    if (!client) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    res.json({ success: true, message: 'Cliente desactivado' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
