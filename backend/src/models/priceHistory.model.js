const mongoose = require('mongoose');

// Historial de precios de cierre — inmutable, se inserta una vez por día por ticker
const priceHistorySchema = new mongoose.Schema(
  {
    ticker: { type: String, required: true, uppercase: true },
    fecha: { type: Date, required: true },
    precio_cierre: { type: Number, required: true },
    moneda: { type: String, enum: ['ARS', 'USD'], required: true },
    fuente: { type: String, required: true },
    tipo_cambio_usd: { type: Number }, // ARS por 1 USD ese día
  },
  { timestamps: false }
);

priceHistorySchema.index({ ticker: 1, fecha: -1 });
priceHistorySchema.index({ fecha: -1 });

module.exports = mongoose.model('PriceHistory', priceHistorySchema);
