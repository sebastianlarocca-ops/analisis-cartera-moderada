/**
 * Seed: Facundo Gutierrez — Cartera Moderada ($20,000 USD)
 *
 * Crea cliente, portfolio y 20 transacciones iniciales.
 * Usa precios actuales del backend para calcular cantidades.
 * Para activos ARS usa DOLAR_RATE como proxy USD→ARS.
 *
 * Uso: node backend/scripts/seed-portfolio-facundo.js
 */

require('dotenv').config({ path: `${__dirname}/../.env` })
const axios = require('axios')

const API = (process.env.RAILWAY_URL || 'http://localhost:3001').replace(/\/$/, '')
const TOTAL_USD = 20_000

// Asignaciones ajustadas para sumar 100% exacto
// (METR: 5→4, YPFD: 4→3 para compensar redondeo)
const ALLOCATION = [
  // ── ADRs / US-listed (USD) ──────────────────────────────
  { ticker: 'MELI',  tipo_activo: 'ADR',    moneda: 'USD', peso: 4.0 },
  { ticker: 'NU',    tipo_activo: 'ADR',    moneda: 'USD', peso: 4.0 },
  { ticker: 'VIST',  tipo_activo: 'ADR',    moneda: 'USD', peso: 3.0 },
  { ticker: 'ADBE',  tipo_activo: 'ADR',    moneda: 'USD', peso: 3.0 },
  { ticker: 'TSLA',  tipo_activo: 'ADR',    moneda: 'USD', peso: 3.0 },
  { ticker: 'JD',    tipo_activo: 'ADR',    moneda: 'USD', peso: 3.0 },
  { ticker: 'UBER',  tipo_activo: 'ADR',    moneda: 'USD', peso: 3.0 },
  { ticker: 'V',     tipo_activo: 'ADR',    moneda: 'USD', peso: 2.0 },
  { ticker: 'PAGS',  tipo_activo: 'ADR',    moneda: 'USD', peso: 2.0 },
  { ticker: 'XP',    tipo_activo: 'ADR',    moneda: 'USD', peso: 2.0 },
  { ticker: 'STNE',  tipo_activo: 'ADR',    moneda: 'USD', peso: 2.0 },
  { ticker: 'MSFT',  tipo_activo: 'ADR',    moneda: 'USD', peso: 1.0 },
  { ticker: 'SPOT',  tipo_activo: 'ADR',    moneda: 'USD', peso: 1.0 },
  // ── Acciones ARG (ARS) ──────────────────────────────────
  { ticker: 'METR',  tipo_activo: 'ACCION', moneda: 'ARS', peso: 4.0 },  // era 5%
  { ticker: 'YPFD',  tipo_activo: 'ACCION', moneda: 'ARS', peso: 3.0 },  // era 4%
  { ticker: 'ECOG',  tipo_activo: 'ACCION', moneda: 'ARS', peso: 4.0 },
  { ticker: 'PAMP',  tipo_activo: 'ACCION', moneda: 'ARS', peso: 3.0 },
  // ── Bonos (ARS) ─────────────────────────────────────────
  { ticker: 'TZX27', tipo_activo: 'BONO',   moneda: 'ARS', peso: 4.0 },
  { ticker: 'AO27',  tipo_activo: 'BONO',   moneda: 'ARS', peso: 4.0 },
  // ── FCI (USD) ────────────────────────────────────────────
  { ticker: 'GALMS', tipo_activo: 'FCI',    moneda: 'USD', peso: 45.0 },
]

const sum = ALLOCATION.reduce((a, x) => a + x.peso, 0)
if (Math.abs(sum - 100) > 0.01) {
  console.error(`❌ Los pesos suman ${sum}%, no 100%`)
  process.exit(1)
}

async function login() {
  const readline = require('readline').createInterface({ input: process.stdin, output: process.stdout })
  const ask = (q) => new Promise((r) => readline.question(q, r))
  console.log('\n── Login de asesor ──────────────────────────')
  const email = await ask('Email: ')
  const password = await ask('Password: ')
  readline.close()
  const res = await axios.post(`${API}/api/auth/login`, { email, password })
  return res.data.token
}

async function run() {
  console.log(`\nAPI: ${API}`)
  console.log(`Portfolio: $${TOTAL_USD.toLocaleString('es-AR')} USD`)
  console.log(`Activos: ${ALLOCATION.length} posiciones\n`)

  const token = await login()
  const headers = { Authorization: `Bearer ${token}` }

  // ── Precios del DB ──
  console.log('\n[1/5] Obteniendo precios del sistema...')
  const pricesRes = await axios.get(`${API}/api/prices`, { headers })
  const pricesMap = {}
  pricesRes.data.data.forEach((p) => { pricesMap[p.ticker] = p })
  console.log(`     ${Object.keys(pricesMap).length} precios disponibles`)

  // Tasa dólar (para convertir inversión USD → ARS en acciones locales)
  // Intenta obtener del DB, si no usa hardcode
  const dolarPrice = pricesMap['DOLAR'] || pricesMap['USD']
  const DOLAR_RATE = dolarPrice?.precio || 1050  // ARS por USD (ajustar si es necesario)
  console.log(`     Tasa USD/ARS usada: $${DOLAR_RATE.toLocaleString('es-AR')}`)

  // ── Crear cliente ──
  console.log('\n[2/5] Creando cliente Facundo Gutierrez...')
  let clienteId
  try {
    const cr = await axios.post(`${API}/api/clients`, {
      nombre: 'Facundo',
      apellido: 'Gutierrez',
      email: 'facundo.gutierrez@gmail.com',
      perfil_riesgo: 'moderado',
    }, { headers })
    clienteId = cr.data.data._id
    console.log(`     ✓ Cliente creado (id: ${clienteId})`)
  } catch (e) {
    if (e.response?.status === 409) {
      console.log('     ⚠ Ya existe, buscando...')
      const list = await axios.get(`${API}/api/clients`, { headers })
      const found = list.data.data.find((c) => c.nombre === 'Facundo' && c.apellido === 'Gutierrez')
      if (!found) { console.error('No se encontró el cliente.'); process.exit(1) }
      clienteId = found._id
      console.log(`     ✓ Encontrado (id: ${clienteId})`)
    } else { throw e }
  }

  // ── Crear portfolio ──
  console.log('\n[3/5] Creando portfolio...')
  const pr = await axios.post(`${API}/api/portfolios`, {
    client_id: clienteId,
    nombre: 'Cartera Moderada',
    descripcion: 'Cartera inicial $20.000 USD — Jun 2026',
    moneda_base: 'USD',
  }, { headers })
  const portfolioId = pr.data.data._id
  console.log(`     ✓ Portfolio creado (id: ${portfolioId})`)

  // ── Crear transacciones ──
  console.log('\n[4/5] Registrando posiciones...\n')
  const fecha = new Date().toISOString().split('T')[0]
  const errors = []

  for (const asset of ALLOCATION) {
    const inversion_usd = TOTAL_USD * asset.peso / 100
    const priceData = pricesMap[asset.ticker]

    let precio, cantidad

    if (!priceData) {
      // Sin precio en DB: usar $1 y cantidad = inversion (placeholder)
      if (asset.moneda === 'USD') {
        precio = 1
        cantidad = inversion_usd
      } else {
        precio = 1
        cantidad = Math.round(inversion_usd * DOLAR_RATE)
      }
      console.log(`  ⚠ ${asset.ticker.padEnd(6)} sin precio en DB — placeholder (USD ${inversion_usd})`)
    } else {
      precio = priceData.precio
      if (asset.moneda === 'USD') {
        cantidad = parseFloat((inversion_usd / precio).toFixed(4))
      } else {
        // Para ARS: invertimos la proporción en pesos
        const inversion_ars = inversion_usd * DOLAR_RATE
        cantidad = parseFloat((inversion_ars / precio).toFixed(2))
      }
    }

    try {
      await axios.post(`${API}/api/transactions`, {
        portfolio_id: portfolioId,
        client_id: clienteId,
        tipo: 'COMPRA',
        ticker: asset.ticker,
        tipo_activo: asset.tipo_activo,
        precio,
        cantidad,
        comision: 0,
        moneda: asset.moneda,
        fecha,
        notas: `Posición inicial ${asset.peso}% — $${inversion_usd.toLocaleString('en-US')} USD`,
      }, { headers })

      const fmt = asset.moneda === 'USD'
        ? `USD ${precio.toFixed(2)} × ${cantidad}`
        : `ARS ${precio.toLocaleString('es-AR')} × ${cantidad.toLocaleString('es-AR')}`
      console.log(`  ✓ ${asset.ticker.padEnd(6)} ${asset.peso}% → ${fmt}`)
    } catch (e) {
      const msg = e.response?.data?.message || e.message
      console.log(`  ✗ ${asset.ticker.padEnd(6)} ERROR: ${msg}`)
      errors.push({ ticker: asset.ticker, error: msg })
    }
  }

  // ── Resumen ──
  console.log('\n[5/5] Resumen ─────────────────────────────')
  console.log(`  Cliente:   Facundo Gutierrez (${clienteId})`)
  console.log(`  Portfolio: Cartera Moderada (${portfolioId})`)
  console.log(`  Activos:   ${ALLOCATION.length - errors.length}/${ALLOCATION.length} creados`)
  if (errors.length) {
    console.log(`\n  Errores (${errors.length}):`)
    errors.forEach((e) => console.log(`    ✗ ${e.ticker}: ${e.error}`))
    console.log('\n  → Los activos con error pueden cargarse manualmente desde el frontend.')
  }
  console.log('\n  ✓ Listo. Abrí el frontend para verificar la cartera.\n')
}

run().catch((e) => {
  console.error('\n✗ Error fatal:', e.response?.data || e.message)
  process.exit(1)
})
