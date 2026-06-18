import { useEffect, useState } from 'react'
import { RefreshCw, ArrowUp, ArrowDown } from 'lucide-react'
import api from '../api/client'
import Badge from '../components/ui/Badge'
import { fmtARS, fmtUSD, fmtPct } from '../lib/utils'

export default function Precios() {
  const [precios, setPrecios] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [updatedAt, setUpdatedAt] = useState(null)

  const load = () =>
    api.get('/prices').then((r) => {
      setPrecios(r.data.data)
      if (r.data.data.length) setUpdatedAt(r.data.data[0].updated_at)
    }).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const handleUpdate = async () => {
    setUpdating(true)
    try { await api.post('/prices/update'); await load() }
    catch (e) { console.error(e) }
    finally { setUpdating(false) }
  }

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.02em' }}>Precios de mercado</h1>
          {updatedAt && (
            <p style={{ fontSize: 11.5, color: '#8b94a8', marginTop: 3 }}>
              Última actualización: {new Date(updatedAt).toLocaleString('es-AR')}
            </p>
          )}
        </div>
        <button className="btn-ghost" onClick={handleUpdate} disabled={updating}>
          <RefreshCw size={13} style={{ animation: updating ? 'spin 1s linear infinite' : 'none' }} />
          {updating ? 'Actualizando...' : 'Actualizar ahora'}
        </button>
      </div>

      <div className="dark-tbl-wrap">
        {loading ? (
          <div className="empty-state">Cargando precios...</div>
        ) : precios.length === 0 ? (
          <div className="empty-state">Sin precios. Ejecutá una actualización o esperá el cron automático.</div>
        ) : (
          <table className="dark-tbl">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Precio</th>
                <th>Variación</th>
                <th>Moneda</th>
                <th>Fuente</th>
                <th>Mercado</th>
              </tr>
            </thead>
            <tbody>
              {precios.map((p) => (
                <tr key={p.ticker}>
                  <td style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: '#c7d0e0', letterSpacing: '0.04em' }}>{p.ticker}</td>
                  <td className="mono" style={{ color: '#e2e8f0', fontWeight: 600 }}>
                    {p.moneda === 'USD' ? fmtUSD(p.precio) : fmtARS(p.precio)}
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 12.5,
                      color: p.variacion_pct >= 0 ? '#34d399' : '#f87171',
                    }}>
                      {p.variacion_pct >= 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                      {fmtPct(p.variacion_pct)}
                    </span>
                  </td>
                  <td><Badge variant={p.moneda === 'USD' ? 'teal' : 'blue'}>{p.moneda}</Badge></td>
                  <td style={{ color: '#717c91', textTransform: 'capitalize', fontSize: 12 }}>{p.fuente}</td>
                  <td><Badge variant={p.mercado_abierto ? 'green' : 'default'}>{p.mercado_abierto ? 'Abierto' : 'Cerrado'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
