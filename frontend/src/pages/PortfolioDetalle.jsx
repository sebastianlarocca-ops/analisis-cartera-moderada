import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, TrendingUp, TrendingDown } from 'lucide-react'
import api from '../api/client'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import { fmtARS, fmtUSD, fmtPct, fmtFecha } from '../lib/utils'

const TIPOS_ACTIVO = ['ACCION', 'CEDEAR', 'ADR', 'BONO', 'ON', 'FCI', 'CRYPTO', 'OTRO']

const emptyTx = {
  tipo: 'COMPRA', ticker: '', tipo_activo: 'ACCION',
  precio: '', cantidad: '', comision: '', moneda: 'ARS', fecha: new Date().toISOString().split('T')[0], notas: '',
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
    const pm = {}
    pr.data.data.forEach((p) => { pm[p.ticker] = p })
    setPrices(pm)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const handleTx = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const body = {
        ...form,
        portfolio_id: id,
        client_id: portfolio.client_id,
        precio: Number(form.precio),
        cantidad: Number(form.cantidad),
        comision: Number(form.comision || 0),
      }
      await api.post('/transactions', body)
      setModal(false)
      setForm(emptyTx)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar operación')
    } finally {
      setSaving(false)
    }
  }

  const calcPnL = (pos) => {
    const p = prices[pos.ticker]
    if (!p) return null
    const diff = (p.precio - pos.precio_promedio_compra) * pos.cantidad_actual
    const pct = ((p.precio - pos.precio_promedio_compra) / pos.precio_promedio_compra) * 100
    return { diff, pct, precio_actual: p.precio }
  }

  if (loading) return <div className="p-8 text-slate-500 text-sm">Cargando...</div>
  if (!portfolio) return <div className="p-8 text-slate-500 text-sm">Portfolio no encontrado</div>

  const positions = portfolio.positions ?? []

  return (
    <div className="p-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft size={15} /> Volver
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{portfolio.nombre}</h1>
          {portfolio.descripcion && <p className="text-sm text-slate-500 mt-0.5">{portfolio.descripcion}</p>}
        </div>
        <Button size="sm" onClick={() => setModal(true)}>
          <Plus size={14} /> Nueva operación
        </Button>
      </div>

      {/* Posiciones */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">Posiciones actuales</h2>
        </div>
        {positions.length === 0 ? (
          <div className="px-6 py-8 text-center text-slate-400 text-sm">Sin posiciones abiertas</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Ticker', 'Tipo', 'Cantidad', 'Precio promedio', 'Precio actual', 'P&L $', 'P&L %'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide first:pl-6 last:pr-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {positions.map((pos) => {
                  const pnl = calcPnL(pos)
                  const fmt = pos.moneda === 'USD' ? fmtUSD : fmtARS
                  return (
                    <tr key={pos.ticker} className="hover:bg-slate-50">
                      <td className="pl-6 pr-4 py-3 font-semibold text-slate-800">{pos.ticker}</td>
                      <td className="px-4 py-3">
                        <Badge>{pos.tipo_activo}</Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700">{pos.cantidad_actual.toLocaleString('es-AR')}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{fmt(pos.precio_promedio_compra)}</td>
                      <td className="px-4 py-3 font-mono text-slate-700">
                        {pnl ? fmt(pnl.precio_actual) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className={`px-4 py-3 font-mono font-medium ${pnl ? (pnl.diff >= 0 ? 'text-emerald-600' : 'text-red-500') : 'text-slate-300'}`}>
                        {pnl ? fmt(pnl.diff) : '—'}
                      </td>
                      <td className={`pr-6 pl-4 py-3 font-medium flex items-center gap-1 ${pnl ? (pnl.pct >= 0 ? 'text-emerald-600' : 'text-red-500') : 'text-slate-300'}`}>
                        {pnl ? (
                          <>
                            {pnl.pct >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                            {fmtPct(pnl.pct)}
                          </>
                        ) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historial de transacciones */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">Historial de operaciones</h2>
        </div>
        {transactions.length === 0 ? (
          <div className="px-6 py-8 text-center text-slate-400 text-sm">Sin operaciones registradas</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Fecha', 'Tipo', 'Ticker', 'Cantidad', 'Precio', 'Total', 'Notas'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide first:pl-6 last:pr-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transactions.map((tx) => {
                  const fmt = tx.moneda === 'USD' ? fmtUSD : fmtARS
                  return (
                    <tr key={tx._id} className="hover:bg-slate-50">
                      <td className="pl-6 pr-4 py-3 text-slate-500 whitespace-nowrap">{fmtFecha(tx.fecha)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={tx.tipo === 'COMPRA' ? 'green' : 'red'}>{tx.tipo}</Badge>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{tx.ticker}</td>
                      <td className="px-4 py-3 font-mono text-slate-700">{tx.cantidad.toLocaleString('es-AR')}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{fmt(tx.precio)}</td>
                      <td className="px-4 py-3 font-mono font-medium text-slate-800">{fmt(tx.precio * tx.cantidad)}</td>
                      <td className="pr-6 pl-4 py-3 text-slate-400 text-xs">{tx.notas || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal nueva operación */}
      <Modal open={modal} onClose={() => { setModal(false); setForm(emptyTx); setError('') }} title="Nueva operación" className="max-w-lg">
        <form onSubmit={handleTx} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>COMPRA</option>
                <option>VENTA</option>
                <option>DIVIDENDO</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">Tipo de activo</label>
              <select value={form.tipo_activo} onChange={(e) => setForm({ ...form, tipo_activo: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {TIPOS_ACTIVO.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Ticker *" value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })} placeholder="Ej: GGAL" required />
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">Moneda</label>
              <select value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>ARS</option>
                <option>USD</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Precio *" type="number" step="0.0001" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} required />
            <Input label="Cantidad *" type="number" step="0.0001" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} required />
            <Input label="Comisión" type="number" step="0.01" value={form.comision} onChange={(e) => setForm({ ...form, comision: e.target.value })} />
          </div>
          <Input label="Fecha" type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">Notas</label>
            <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={2}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          {error && <p className="text-red-600 text-xs">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Registrar'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
