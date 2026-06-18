require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

const clientsRouter = require('./src/routes/clients.routes');
const portfoliosRouter = require('./src/routes/portfolios.routes');
const transactionsRouter = require('./src/routes/transactions.routes');

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

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
