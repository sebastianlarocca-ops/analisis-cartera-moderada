# Cartera Moderada — Documentación de desarrollo

## Descripción del proyecto

Plataforma de gestión de carteras de inversión para asesor financiero.  
El asesor crea y administra carteras para sus clientes; en fases futuras los clientes tendrán su propia vista de solo lectura.

---

## Stack tecnológico

| Capa          | Tecnología                    | Hosting          |
|---------------|-------------------------------|------------------|
| Frontend      | HTML estático (hoy) → React + Vite (próximo) | Vercel |
| Backend       | Node.js + Express             | Railway          |
| Base de datos | MongoDB Atlas                 | Atlas free tier  |
| Precios       | GitHub Actions (Python/yfinance) | GitHub (gratis) |

---

## Estructura de carpetas

```
/
├── index.html                        ← Frontend actual (estático)
├── .github/
│   └── workflows/
│       └── update-prices.yml         ← Cron de precios (GitHub Actions)
├── scripts/
│   └── fetch-prices.py               ← Script Python que fetchea Yahoo y pushea a Railway
├── backend/                          ← API REST
│   ├── server.js                     ← Entry point + cron node
│   ├── railway.json                  ← Config de deploy
│   ├── .env.example                  ← Variables requeridas
│   └── src/
│       ├── config/db.js
│       ├── middleware/errorHandler.js
│       ├── models/
│       │   ├── client.model.js
│       │   ├── portfolio.model.js
│       │   ├── transaction.model.js
│       │   ├── price.model.js        ← Precio actual (upsert)
│       │   └── priceHistory.model.js ← Historial diario
│       ├── routes/
│       │   ├── clients.routes.js
│       │   ├── portfolios.routes.js
│       │   ├── transactions.routes.js
│       │   └── prices.routes.js
│       └── services/prices/
│           ├── priceService.js       ← Orquesta adapters + persistencia
│           └── adapters/
│               ├── yahooAdapter.js   ← Acciones, CEDEARs, ADRs, Bonos
│               ├── galileoAdapter.js ← FCI Galileo (cuotapartes vía web)
│               └── bcraAdapter.js    ← Tipo de cambio (dolarapi.com)
└── DESARROLLO.md
```

---

## Variables de entorno

### Railway (backend)
```env
PORT=8080                    # Railway lo inyecta automáticamente
MONGODB_URI=mongodb+srv://...
NODE_ENV=production
PRICES_PUSH_SECRET=<string aleatorio generado con crypto.randomBytes(32)>
```

### GitHub Secrets (Actions)
| Secret               | Valor                                              |
|----------------------|----------------------------------------------------|
| `RAILWAY_URL`        | `https://analisis-cartera-moderada-production.up.railway.app` |
| `PRICES_PUSH_SECRET` | El mismo string que en Railway                     |

---

## Correr localmente

```bash
cd backend
npm install
cp .env.example .env   # completar MONGODB_URI y PRICES_PUSH_SECRET
npm run dev            # nodemon — hot reload en puerto 3001
```

```bash
curl http://localhost:3001/health
# → { "status": "ok" }
```

---

## Sistema de actualización de precios

### Flujo

```
GitHub Actions (cron cada 30 min, L-V 10:00-17:00 ART)
  → scripts/fetch-prices.py
      → yfinance fetchea Yahoo Finance (IPs de GitHub, no bloqueadas)
      → GET Railway /api/prices/tickers  (qué tickers actualizar)
      → POST Railway /api/prices/push    (envía los precios pre-calculados)
  → Railway guarda en MongoDB (prices + priceHistory)
  → BCRA rates se fetchean en Railway vía dolarapi.com
```

Para **FCI Galileo**: Railway fetchea directamente `galileoargentina.com.ar/api/fondos` — no pasa por GitHub Actions porque la web de Galileo no bloquea IPs de datacenter.

### Por qué GitHub Actions y no Railway directo
Yahoo Finance bloquea IPs de datacenter conocidas (Railway usa AWS). Las IPs de GitHub Actions no están en esa lista. El script Python corre en GitHub, fetchea Yahoo, y le manda los precios a Railway vía endpoint autenticado.

### Fuentes por tipo de activo

| tipo_activo | Fuente           | Formato ticker | Moneda |
|-------------|------------------|----------------|--------|
| ACCION      | Yahoo Finance    | `GGAL.BA`      | ARS    |
| CEDEAR      | Yahoo Finance    | `AAPL.BA`      | ARS    |
| ADR         | Yahoo Finance    | `GGAL`         | USD    |
| BONO        | Yahoo Finance    | `AL30.BA`      | ARS    |
| ON          | Yahoo Finance    | `ticker.BA`    | ARS    |
| FCI         | galileoargentina.com.ar | abreviación interna | USD/ARS |

### Cron schedule
- **GitHub Actions**: `0,30 13-20 * * 1-5` (cada 30 min entre 13:00-20:00 UTC = 10:00-17:00 ART)
- **Railway node-cron** (backup): `0,30 14-20 * * 1-5`

---

## API — Endpoints

### Health
```
GET /health
→ { "status": "ok" }
```

---

### Clientes  `/api/clients`

| Método | Ruta   | Descripción                      |
|--------|--------|----------------------------------|
| GET    | `/`    | Lista clientes activos           |
| GET    | `/:id` | Cliente por ID                   |
| POST   | `/`    | Crea cliente                     |
| PUT    | `/:id` | Actualiza datos                  |
| DELETE | `/:id` | Soft delete (`activo: false`)    |

**Body POST/PUT:**
```json
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@email.com",
  "telefono": "+54911...",
  "perfil_riesgo": "moderado",
  "notas": "..."
}
```
`perfil_riesgo`: `conservador` | `moderado` | `agresivo`

---

### Portfolios  `/api/portfolios`

| Método | Ruta   | Descripción                                    |
|--------|--------|------------------------------------------------|
| GET    | `/`    | Lista portfolios (`?client_id=xxx` para filtrar) |
| GET    | `/:id` | Portfolio con positions actuales               |
| POST   | `/`    | Crea portfolio                                 |
| PUT    | `/:id` | Actualiza nombre/descripción                   |
| DELETE | `/:id` | Soft delete                                    |

> `positions[]` es un snapshot calculado automáticamente. **Nunca se edita a mano.**

---

### Transacciones  `/api/transactions`

| Método | Ruta    | Descripción                                              |
|--------|---------|----------------------------------------------------------|
| GET    | `/`     | Lista con filtros: `portfolio_id`, `ticker`, `desde`, `hasta` |
| GET    | `/:id`  | Detalle                                                  |
| POST   | `/`     | Registra COMPRA/VENTA y recalcula positions              |

> **Sin PUT ni DELETE.** Las transacciones son inmutables.

**Body POST:**
```json
{
  "portfolio_id": "<ObjectId>",
  "client_id": "<ObjectId>",
  "tipo": "COMPRA",
  "ticker": "GGAL",
  "tipo_activo": "ACCION",
  "precio": 1250.50,
  "cantidad": 100,
  "comision": 5.00,
  "moneda": "ARS",
  "fecha": "2025-03-15T00:00:00Z",
  "notas": "..."
}
```

`tipo`: `COMPRA` | `VENTA` | `DIVIDENDO`  
`tipo_activo`: `CEDEAR` | `ACCION` | `ADR` | `BONO` | `ON` | `FCI` | `CRYPTO` | `OTRO`

---

### Precios  `/api/prices`

| Método | Ruta                          | Descripción                                  |
|--------|-------------------------------|----------------------------------------------|
| GET    | `/`                           | Todos los precios actuales                   |
| GET    | `/tickers`                    | Tickers activos (portfolios con posición > 0) |
| GET    | `/:ticker`                    | Precio actual de un ticker                   |
| GET    | `/:ticker/history`            | Historial (`?desde=&hasta=`)                 |
| POST   | `/update`                     | Trigger manual (Railway fetchea directo)     |
| POST   | `/push`                       | Recibe precios de GitHub Actions (**requiere `Authorization: Bearer <secret>`**) |
| GET    | `/cafci/search?nombre=galileo`| Buscar IDs de fondos en CAFCI                |

---

## Modelo de datos — MongoDB

### `clients`
```js
{ _id, nombre, apellido, email, telefono,
  perfil_riesgo: 'conservador|moderado|agresivo',
  activo: Boolean, notas, createdAt, updatedAt }
```

### `portfolios`
```js
{ _id, client_id, nombre, descripcion, moneda_base: 'ARS|USD',
  activo: Boolean,
  positions: [{ ticker, tipo_activo, cantidad_actual, precio_promedio_compra, moneda }],
  createdAt, updatedAt }
```

### `transactions` ← fuente de verdad
```js
{ _id, portfolio_id, client_id,
  tipo: 'COMPRA|VENTA|DIVIDENDO',
  ticker, tipo_activo, precio, cantidad, comision,
  moneda: 'ARS|USD', fecha, notas, createdAt, updatedAt }
```

Índices: `{ portfolio_id, fecha }`, `{ ticker, fecha }`, `{ client_id, fecha }`

### `prices`
```js
{ ticker, precio, moneda, variacion_pct, mercado_abierto,
  fuente: 'yahoo|galileo|bcra', updated_at }
```
Unique index en `ticker`. Se hace upsert en cada actualización.

### `priceHistory`
```js
{ ticker, fecha, precio_cierre, moneda, fuente, tipo_cambio_usd }
```
Índice único `{ ticker, fecha }`. Se inserta una vez por día.

---

## Decisiones de arquitectura

### Transacciones inmutables
Cada operación se graba como evento permanente. El estado actual (`positions`) se deriva de toda la historia. Permite calcular P&L en cualquier fecha pasada y auditar cualquier operación.

### Weighted average purchase price
Al recalcular positions se usa precio promedio ponderado:
- COMPRA: `nuevo_promedio = (costo_acumulado + precio * cantidad) / cantidad_total`
- VENTA: reduce cantidad, mantiene el mismo precio promedio

### Soft delete
Clientes y portfolios usan `activo: false` para preservar el historial de transacciones.

### GitHub Actions como fetcher de precios
Yahoo Finance bloquea IPs de Railway (AWS). Las IPs de GitHub Actions no están bloqueadas. El script Python usa `yfinance` que maneja sesión/crumb internamente. Los precios se pushean a Railway via endpoint autenticado con secret compartido.

---

## Deploy en Railway

**URL de producción:** `https://analisis-cartera-moderada-production.up.railway.app`

1. Repo conectado en [railway.app](https://railway.app)
2. Settings → Root Directory: `backend`
3. Variables de entorno: `MONGODB_URI`, `NODE_ENV=production`, `PRICES_PUSH_SECRET`
4. Railway inyecta `PORT` automáticamente (usa 8080)
5. `railway.json` define `startCommand: "npm start"` y `healthcheckPath: "/health"`

---

## Roadmap

### Fase 1 — Backend CRUD ✓
- [x] Modelos: Client, Portfolio, Transaction
- [x] CRUD completo (clientes, portfolios, transacciones)
- [x] Recálculo automático de positions con precio promedio ponderado
- [x] Deploy Railway + MongoDB Atlas verificado en producción

### Fase 2 — Precios ✓
- [x] Modelos `prices` y `priceHistory`
- [x] Yahoo Finance adapter (acciones AR, CEDEARs, ADRs, Bonos)
- [x] Galileo adapter (cuotapartes FCI via galileoargentina.com.ar)
- [x] BCRA adapter (tipo de cambio via dolarapi.com)
- [x] GitHub Actions cron (cada 30 min L-V 10:00-17:00 ART)
- [x] Endpoint `POST /push` autenticado para recibir precios de GitHub Actions
- [x] Endpoint `GET /tickers` para que el script sepa qué fetchear

### Fase 3 — Autenticación (pendiente)
- [ ] JWT con roles `asesor` y `cliente`
- [ ] Asesor: acceso total
- [ ] Cliente: solo lectura de su cartera (sin precios de compra)
- [ ] Middleware `auth` + `authorize(roles)`

### Fase 4 — Frontend React (pendiente)
- [ ] React + Vite, deploy en Vercel
- [ ] Vista asesor: dashboard, gestión de clientes, registro de operaciones
- [ ] Vista cliente: cartera simplificada, evolución
