require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');

const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

const clientsRouter = require('./src/routes/clients.routes');
const portfoliosRouter = require('./src/routes/portfolios.routes');
const transactionsRouter = require('./src/routes/transactions.routes');
const pricesRouter = require('./src/routes/prices.routes');

const { updateAllPrices } = require('./src/services/prices/priceService');

const app = express();

connectDB();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/clients', clientsRouter);
app.use('/api/portfolios', portfoliosRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/prices', pricesRouter);

app.use(errorHandler);

// Cron: cada 30 min en horario BYMA (11:00–17:30 ART = 14:00–20:30 UTC), lunes a viernes
// Expresión: minutos 0 y 30, horas 14-20 UTC, cualquier día del mes, cualquier mes, lun-vie
cron.schedule('0,30 14-20 * * 1-5', async () => {
  console.log('[cron] Actualizando precios...');
  await updateAllPrices().catch((err) =>
    console.error('[cron] Error actualizando precios:', err.message)
  );
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
