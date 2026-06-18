# Cartera Moderada — Documentación de desarrollo

## Descripción del proyecto

Plataforma de gestión de carteras de inversión para asesor financiero.  
El asesor crea y administra carteras para sus clientes; en fases futuras los clientes tendrán su propia vista de solo lectura.

---

## Stack tecnológico

| Capa       | Tecnología              | Hosting     |
|------------|-------------------------|-------------|
| Frontend   | HTML estático (hoy) → React + Vite (próximo) | Vercel |
| Backend    | Node.js + Express       | Railway     |
| Base de datos | MongoDB Atlas        | Atlas free tier |

---

## Estructura de carpetas

```
/
├── index.html              ← Frontend actual (estático)
├── backend/                ← API REST
│   ├── server.js           ← Entry point
│   ├── railway.json        ← Config de deploy en Railway
│   ├── .env.example        ← Variables de entorno necesarias
│   └── src/
│       ├── config/
│       │   └── db.js       ← Conexión a MongoDB
│       ├── middleware/
│       │   └── errorHandler.js
│       ├── models/
│       │   ├── client.model.js
│       │   ├── portfolio.model.js
│       │   └── transaction.model.js
│       └── routes/
│           ├── clients.routes.js
│           ├── portfolios.routes.js
│           └── transactions.routes.js
└── DESARROLLO.md           ← Este archivo
```

---

## Variables de entorno

Copiar `.env.example` a `.env` y completar:

```env
PORT=3001
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/cartera-moderada?retryWrites=true&w=majority
NODE_ENV=development
```

En Railway: configurar estas variables en el panel → Variables.

---

## Correr localmente

```bash
cd backend
npm install
cp .env.example .env   # completar con la URI de Atlas
npm run dev            # nodemon — hot reload
```

Verificar que el servidor responde:
```bash
curl http://localhost:3001/health
# → { "status": "ok" }
```

---

## API — Endpoints

### Health
```
GET /health
```

### Clientes  `/api/clients`

| Método | Ruta            | Descripción                        |
|--------|-----------------|------------------------------------|
| GET    | `/`             | Lista todos los clientes activos   |
| GET    | `/:id`          | Obtiene un cliente por ID          |
| POST   | `/`             | Crea un nuevo cliente              |
| PUT    | `/:id`          | Actualiza datos del cliente        |
| DELETE | `/:id`          | Soft delete (activo: false)        |

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
`perfil_riesgo` acepta: `conservador` | `moderado` | `agresivo`

---

### Portfolios  `/api/portfolios`

| Método | Ruta            | Descripción                                          |
|--------|-----------------|------------------------------------------------------|
| GET    | `/`             | Lista portfolios (filtrar con `?client_id=xxx`)      |
| GET    | `/:id`          | Obtiene portfolio con positions actuales             |
| POST   | `/`             | Crea nuevo portfolio para un cliente                 |
| PUT    | `/:id`          | Actualiza metadata (nombre, descripción). **Nunca** edita `positions` directamente |
| DELETE | `/:id`          | Soft delete                                          |

**Body POST:**
```json
{
  "client_id": "<ObjectId>",
  "nombre": "Cartera Moderada 2025",
  "descripcion": "...",
  "moneda_base": "ARS"
}
```

El campo `positions[]` es un **snapshot calculado automáticamente** al procesar transacciones. No se edita a mano.

---

### Transacciones  `/api/transactions`

| Método | Ruta    | Descripción                                                     |
|--------|---------|-----------------------------------------------------------------|
| GET    | `/`     | Lista con filtros: `portfolio_id`, `client_id`, `ticker`, `tipo`, `desde`, `hasta` |
| GET    | `/:id`  | Detalle de una transacción                                      |
| POST   | `/`     | Registra COMPRA/VENTA y recalcula el portfolio automáticamente  |

> **No hay PUT ni DELETE.** Las transacciones son inmutables — son la fuente de verdad histórica.

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

`tipo` acepta: `COMPRA` | `VENTA` | `DIVIDENDO`  
`tipo_activo` acepta: `CEDEAR` | `ACCION` | `BONO` | `FCI` | `CRYPTO` | `OTRO`  
`moneda` acepta: `ARS` | `USD`

**Respuesta POST — incluye el portfolio recalculado:**
```json
{
  "success": true,
  "data": { ...transaccion },
  "positions_actualizadas": [
    {
      "ticker": "GGAL",
      "tipo_activo": "ACCION",
      "cantidad_actual": 100,
      "precio_promedio_compra": 1250.50,
      "moneda": "ARS"
    }
  ]
}
```

---

## Modelo de datos — MongoDB

### Colección `clients`
```js
{
  _id, nombre, apellido, email, telefono,
  perfil_riesgo: 'conservador|moderado|agresivo',
  activo: Boolean,
  notas: String,
  createdAt, updatedAt   // timestamps automáticos
}
```

### Colección `portfolios`
```js
{
  _id, client_id, nombre, descripcion,
  moneda_base: 'ARS|USD',
  activo: Boolean,
  positions: [
    { ticker, tipo_activo, cantidad_actual, precio_promedio_compra, moneda }
  ],
  createdAt, updatedAt
}
```

### Colección `transactions` ← fuente de verdad
```js
{
  _id, portfolio_id, client_id,
  tipo: 'COMPRA|VENTA|DIVIDENDO',
  ticker, tipo_activo,
  precio, cantidad, comision,
  moneda: 'ARS|USD',
  fecha: Date,
  notas: String,
  createdAt, updatedAt
}
```

**Índices:**
- `{ portfolio_id, fecha }` — query más frecuente
- `{ ticker, fecha }` — rendimiento por activo
- `{ client_id, fecha }` — historial por cliente

---

## Decisiones de arquitectura

### Por qué transacciones inmutables
Cada compra/venta se graba como un evento que **nunca se modifica ni elimina**.  
El estado actual de la cartera (`positions`) se deriva de todas las transacciones.  
Esto permite:
- Calcular P&L realizado y no realizado en cualquier fecha pasada
- Ver la evolución de la cartera en el tiempo
- Auditar cualquier operación

### Por qué MongoDB sobre PostgreSQL
Las posiciones de una cartera varían en estructura (CEDEARs, bonos, FCIs tienen campos distintos).  
El esquema flexible de Mongo permite agregar campos sin migraciones.

### Soft delete en lugar de delete real
Clientes y portfolios usan `activo: false` en lugar de borrado físico para preservar el historial de transacciones asociadas.

---

## Deploy en Railway

1. Conectar el repositorio en [railway.app](https://railway.app)
2. Seleccionar la carpeta `/backend` como root directory
3. Configurar variables de entorno en el panel de Railway:
   - `MONGODB_URI`
   - `NODE_ENV=production`
   - `PORT` (Railway lo inyecta automáticamente)
4. Railway detecta `railway.json` y usa `npm start` como comando

---

## Roadmap

### Fase 1 — Completada ✓
- [x] Scaffold backend Node/Express
- [x] Modelos: Client, Portfolio, Transaction
- [x] CRUD completo de clientes
- [x] CRUD de portfolios
- [x] Registro de transacciones + recálculo automático de positions

### Fase 2 — Precios
- [ ] Colección `price_history`
- [ ] Integración IOL / ByMA para acciones AR
- [ ] Integración yfinance o Alpha Vantage para CEDEARs/ETFs
- [ ] Integración BCRA API para tipo de cambio
- [ ] Endpoint `/api/prices/update` — actualización manual o cron
- [ ] Endpoint `/api/portfolios/:id/performance` — retorno por ventana de tiempo

### Fase 3 — Autenticación
- [ ] JWT con dos roles: `asesor` y `cliente`
- [ ] El asesor ve y edita todo
- [ ] El cliente ve solo su cartera (sin precios de compra)
- [ ] Middleware `auth` + `authorize(roles)`

### Fase 4 — Frontend React
- [ ] Migrar index.html a React + Vite
- [ ] Vista asesor: dashboard completo, gestión de clientes, registro de operaciones
- [ ] Vista cliente: cartera simplificada, evolución, notificaciones
- [ ] Deploy Vercel conectado a la API en Railway
