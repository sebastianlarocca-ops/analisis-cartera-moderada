const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { auth, authorize } = require('../middleware/auth');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email y password requeridos' });
    }

    const user = await User.findOne({ email, activo: true }).select('+password');
    if (!user || !(await user.verifyPassword(password))) {
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
    }

    const token = signToken(user._id);
    res.json({
      success: true,
      token,
      user: { id: user._id, nombre: user.nombre, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me — requiere token
router.get('/me', auth, async (req, res) => {
  res.json({ success: true, data: req.user });
});

// POST /api/auth/register — solo el asesor puede crear nuevos usuarios
router.post('/register', auth, authorize('asesor'), async (req, res, next) => {
  try {
    const { nombre, email, password, role, client_id } = req.body;

    if (!nombre || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'nombre, email, password y role son requeridos' });
    }
    if (!['asesor', 'cliente'].includes(role)) {
      return res.status(400).json({ success: false, message: 'role debe ser asesor o cliente' });
    }
    if (role === 'cliente' && !client_id) {
      return res.status(400).json({ success: false, message: 'client_id requerido para role cliente' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Email ya registrado' });
    }

    const user = await User.create({ nombre, email, password, role, client_id: client_id || null });
    res.status(201).json({
      success: true,
      data: { id: user._id, nombre: user.nombre, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/password — cambiar propia contraseña
router.put('/password', auth, async (req, res, next) => {
  try {
    const { password_actual, password_nuevo } = req.body;
    if (!password_actual || !password_nuevo) {
      return res.status(400).json({ success: false, message: 'password_actual y password_nuevo requeridos' });
    }
    if (password_nuevo.length < 8) {
      return res.status(400).json({ success: false, message: 'El nuevo password debe tener al menos 8 caracteres' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.verifyPassword(password_actual))) {
      return res.status(401).json({ success: false, message: 'Password actual incorrecto' });
    }

    user.password = password_nuevo;
    await user.save();
    res.json({ success: true, message: 'Password actualizado' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
