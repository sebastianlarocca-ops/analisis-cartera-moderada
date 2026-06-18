const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// Tipos que cotizan en BYMA (mercado local) → requieren sufijo .BA
const TIPOS_LOCALES = ['ACCION', 'CEDEAR', 'BONO'];

const buildYahooTicker = (ticker, tipo_activo) => {
  if (TIPOS_LOCALES.includes(tipo_activo)) return `${ticker}.BA`;
  return ticker; // ADR cotiza directo en NYSE/NASDAQ
};

const fetchPrice = async (ticker, tipo_activo) => {
  const yahooTicker = buildYahooTicker(ticker, tipo_activo);

  const quote = await yahooFinance.quote(yahooTicker, {}, { validateResult: false });

  if (!quote || quote.regularMarketPrice == null) {
    throw new Error(`Yahoo Finance no devolvió precio para ${yahooTicker}`);
  }

  return {
    ticker,
    precio: quote.regularMarketPrice,
    moneda: tipo_activo === 'ADR' ? 'USD' : 'ARS',
    variacion_pct: quote.regularMarketChangePercent ?? 0,
    mercado_abierto: quote.marketState === 'REGULAR',
    fuente: 'yahoo',
  };
};

module.exports = { fetchPrice };
