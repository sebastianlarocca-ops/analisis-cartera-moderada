const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    apellido: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    telefono: { type: String, trim: true },
    perfil_riesgo: {
      type: String,
      enum: ['conservador', 'moderado', 'agresivo'],
      default: 'moderado',
    },
    activo: { type: Boolean, default: true },
    notas: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Client', clientSchema);
