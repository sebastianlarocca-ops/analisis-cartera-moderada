import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, ArrowUp, ArrowDown } from 'lucide-react'
import api from '../api/client'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import { fmtARS, fmtUSD, fmtPct, fmtFecha } from '../lib/utils'

const TIPOS_ACTIVO = ['ACCION', 'CEDEAR', 'ADR', 'BONO', 'ON', 'FCI', 'CRYPTO', 'OTRO']

const emptyTx = {
  tipo: 'COMPRA', ticker: '', tipo_activo: 'ACCION',
  precio: '', cantidad: '', comision: '', moneda: 'ARS',
  fecha: new Date().toISOString().split('T')[0], notas: '',
}

export default function PortfolioDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [portfolio, setPortfolio] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [prices, setPrices] = useState({})
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyTx)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const [p, tx, pr] = await Promise.all([
      api.get(`/portfolios/${id}`),
      api.get(`/transactions?portfolio_id=${id}`),
      api.get('/prices'),
    ])
    setPortfolio(p.data.data)
    setTransactions(tx.data.data)
    const pm = {}; pr.data.data.forEach((p) => { pm[p.ticker] = p }); setPrices(pm)
    setLoading(false)
  }
  useEffect(() => { load() }, [id])

  const handleTx = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await api.post('/transactions', {
        ...form, portfolio_id: id, client_id: portfolio.client_id,
        precio: Number(form.precio), cantidad: Number(form.cantidad), comision: Number(form.comision || 0),
      })
      setModal(false); setForm(emptyTx); load()
    } catch (err) { setError(err.response?.data?.message || 'Error al registrar operación') }
    finally { setSaving(false) }
  }

  const calcPnL = (pos) => {
    const p = prices[pos.ticker]
    if (!p) return null
    const diff = (p.precio - pos.precio_promedio_compra) * pos.cantidad_actual
    const pct = ((p.precio - pos.precio_promedio_compra) / pos.precio_promedio_compra) * 100
    return { diff, pct, precio_actual: p.precio }
  }

  if (loading) return <div style={{ padding: 32, color: '#717c91', fontSize: 13 }}>Cargando...</div>
  if (!portfolio) return <div style={{ padding: 32, color: '#717c91', fontSize: 13 }}>Portfolio no encontrado</div>

  const positions = portfolio.positions ?? []

  return (
    <div style={{ padding: 32 }}>
      <button className="back-link" onClick={() => navigate(-1)} style={{ marginBottom: 24 }}>
        <ArrowLeft size={14} /> Volver
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.02em' }}>{portfolio.nombre}</h1>
          {portfolio.descripcion && <p style={{ fontSize: 12.5, color: '#8b94a8', marginTop: 3 }}>{portfolio.descripcion}</p>}
        </div>
        <button className="btn-primary" style={{ padding: '7px 14px', fontSize: 12 }} onClick={() => setModal(true)}>
          <Plus size={13} /> Nueva operación
        </button>
      </div>

      {/* Posiciones */}
      <div className="dark-tbl-wrap" style={{ marginBottom: 24 }}>
        <div className="section-hdr">
          <span className="section-hdr-title">Posiciones actuales</span>
          <span style={{ fontSize: 11, color: '#717c91' }}>{positions.length} activos</span>
        </div>
        {positions.length === 0 ? (
          <div className="empty-state">Sin posiciones abiertas</div>
        ) : (
          <table className="dark-tbl">
            <thead>
              <tr>
                <th>Ticker</th><th>Tipo</th><th>Cantidad</th>
                <th>Precio promedio</th><th>Precio actual</th>
                <th>P&amp;L $</th><th>P&amp;L %</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => {
                const pnl = calcPnL(pos)
                const fmt = pos.moneda === 'USD' ? fmtUSD : fmtARS
                const gain = pnl && pnl.diff >= 0
                return (
                  <tr key={pos.ticker}>
                    <td style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: '#c7d0e0', letterSpacing: '0.04em' }}>{pos.ticker}</td>
                    <td><Badge>{pos.tipo_activo}</Badge></td>
                    <td className="mono" style={{ color: '#e2e8f0' }}>{pos.cantidad_actual.toLocaleString('es-AR')}</td>
                    <td className="mono" style={{ color: '#8b94a8' }}>{fmt(pos.precio_promedio_compra)}</td>
                    <td className="mono" style={{ color: '#e2e8f0' }}>{pnl ? fmt(pnl.precio_actual) : <span style={{ color: '#4a5568' }}>—</span>}</td>
                    <td className="mono" style={{ fontWeight: 600, color: pnl ? (gain ? '#34d399' : '#f87171') : '#4a5568' }}>
                      {pnl ? fmt(pnl.diff) : '—'}
                    </td>
                    <td>
                      {pnl ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 12.5, color: gain ? '#34d399' : '#f87171' }}>
                          {gain ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                          {fmtPct(pnl.pct)}
                        </span>
                      ) : <span style={{ color: '#4a5568' }}>—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Historial */}
      <div className="dark-tbl-wrap">
        <div className="section-hdr">
          <span className="section-hdr-title">Historial de operaciones</span>
          <span style={{ fontSize: 11, color: '#717c91' }}>{transactions.length} operaciones</span>
        </div>
        {transactions.length === 0 ? (
          <div className="empty-state">Sin operaciones registradas</div>
        ) : (
          <table className="dark-tbl">
            <thead>
              <tr>
                <th>Fecha</th><th>Tipo</th><th>Ticker</th>
                <th>Cantidad</th><th>Precio</th><th>Total</th><th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const fmt = tx.moneda === 'USD' ? fmtUSD : fmtARS
                return (
                  <tr key={tx._id}>
                    <td style={{ color: '#8b94a8', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtFecha(tx.fecha)}</td>
                    <td><Badge variant={tx.tipo === 'COMPRA' ? 'green' : tx.tipo === 'VENTA' ? 'red' : 'blue'}>{tx.tipo}</Badge></td>
                    <td style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: '#c7d0e0' }}>{tx.ticker}</td>
                    <td className="mono" style={{ color: '#e2e8f0' }}>{tx.cantidad.toLocaleString('es-AR')}</td>
                    <td className="mono" style={{ color: '#8b94a8' }}>{fmt(tx.precio)}</td>
                    <td className="mono" style={{ fontWeight: 600, color: '#e2e8f0' }}>{fmt(tx.precio * tx.cantidad)}</td>
                    <td style={{ color: '#717c91', fontSize: 12 }}>{tx.notas || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal nueva operación */}
      <Modal open={modal} onClose={() => { setModal(false); setForm(emptyTx); setError('') }} title="Nueva operación" className="max-w-lg">
        <form onSubmit={handleTx} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="dark-label">Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="dark-select">
                <option>COMPRA</option><option>VENTA</option><option>DIVIDENDO</option>
              </select>
            </div>
            <div>
              <label className="dark-label">Tipo de activo</label>
              <select value={form.tipo_activo} onChange={(e) => setForm({ ...form, tipo_activo: e.target.value })} className="dark-select">
                {TIPOS_ACTIVO.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Input label="Ticker *" value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })} placeholder="Ej: GGAL" required />
            <div>
              <label className="dark-label">Moneda</label>
              <select value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value })} className="dark-select">
                <option>ARS</option><option>USD</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Input label="Precio *" type="number" step="0.0001" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} required />
            <Input label="Cantidad *" type="number" step="0.0001" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} required />
            <Input label="Comisión" type="number" step="0.01" value={form.comision} onChange={(e) => setForm({ ...form, comision: e.target.value })} />
          </div>
          <Input label="Fecha" type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
          <div>
            <label className="dark-label">Notas</label>
            <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={2} className="dark-textarea" />
          </div>
          {error && <p style={{ fontSize: 12, color: '#f87171' }}>{error}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
            <button type="button" className="btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Registrar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
