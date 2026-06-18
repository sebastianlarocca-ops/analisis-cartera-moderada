const mongoose = require('mongoose');

const positionSchema = new mongoose.Schema(
  {
    ticker: { type: String, required: true, uppercase: true, trim: true },
    tipo_activo: {
      type: String,
      enum: ['CEDEAR', 'ACCION', 'BONO', 'FCI', 'CRYPTO', 'OTRO'],
      required: true,
    },
    cantidad_actual: { type: Number, required: true, default: 0 },
    precio_promedio_compra: { type: Number, required: true, default: 0 },
    moneda: { type: String, enum: ['ARS', 'USD'], default: 'ARS' },
  },
  { _id: false }
);

const portfolioSchema = new mongoose.Schema(
  {
    client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String },
    moneda_base: { type: String, enum: ['ARS', 'USD'], default: 'ARS' },
    activo: { type: Boolean, default: true },
    // Snapshot recalculado cada vez que entra una transacción
    positions: [positionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Portfolio', portfolioSchema);
