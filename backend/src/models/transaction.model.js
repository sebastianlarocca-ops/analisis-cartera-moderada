const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    portfolio_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio', required: true },
    client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    tipo: {
      type: String,
      enum: ['COMPRA', 'VENTA', 'DIVIDENDO'],
      required: true,
    },
    ticker: { type: String, required: true, uppercase: true, trim: true },
    tipo_activo: {
      type: String,
      enum: ['CEDEAR', 'ACCION', 'ADR', 'BONO', 'ON', 'FCI', 'CRYPTO', 'OTRO'],
      required: true,
    },
    precio: { type: Number, required: true },
    cantidad: { type: Number, required: true },
    comision: { type: Number, default: 0 },
    moneda: { type: String, enum: ['ARS', 'USD'], default: 'ARS' },
    fecha: { type: Date, required: true, default: Date.now },
    notas: { type: String },
  },
  {
    timestamps: true,
    // Las transacciones nunca se editan — solo lectura después de creadas
  }
);

// Índices para las queries más frecuentes
transactionSchema.index({ portfolio_id: 1, fecha: -1 });
transactionSchema.index({ ticker: 1, fecha: -1 });
transactionSchema.index({ client_id: 1, fecha: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
