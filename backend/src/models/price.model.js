const mongoose = require('mongoose');

// Precio actual por ticker — se upserta en cada actualización
const priceSchema = new mongoose.Schema(
  {
    ticker: { type: String, required: true, unique: true, uppercase: true },
    precio: { type: Number, required: true },
    moneda: { type: String, enum: ['ARS', 'USD'], required: true },
    variacion_pct: { type: Number, default: 0 },
    mercado_abierto: { type: Boolean, default: false },
    fuente: { type: String, required: true },
    updated_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

module.exports = mongoose.model('Price', priceSchema);
