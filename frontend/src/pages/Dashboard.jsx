import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Briefcase, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react'
import api from '../api/client'
import { fmtARS, fmtUSD, fmtPct } from '../lib/utils'

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="glass" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#717c91', marginBottom: 8 }}>
            {label}
          </p>
          <p style={{ fontSize: 26, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.02em', fontFamily: 'var(--mono)' }}>
            {value}
          </p>
        </div>
        <div style={{
          width: 42, height: 42, borderRadius: 10,
          background: accent.bg, border: `1px solid ${accent.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 20px -4px ${accent.glow}`,
        }}>
          <Icon size={18} color={accent.color} />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ clientes: 0, portfolios: 0, precios: 0 })
  const [precios, setPrecios] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/clients'),
      api.get('/portfolios'),
      api.get('/prices'),
    ]).then(([c, p, pr]) => {
      setStats({ clientes: c.data.data.length, portfolios: p.data.data.length, precios: pr.data.data.length })
      setPrecios(pr.data.data.slice(0, 12))
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ padding: 32, color: '#717c91', fontSize: 13 }}>Cargando...</div>
  )

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.02em' }}>Dashboard</h1>
        <p style={{ fontSize: 12.5, color: '#8b94a8', marginTop: 3 }}>Resumen general del sistema</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard icon={Users} label="Clientes activos" value={stats.clientes}
          accent={{ bg: 'rgba(99,102,241,0.13)', border: 'rgba(99,102,241,0.22)', color: '#818cf8', glow: 'rgba(99,102,241,0.4)' }} />
        <StatCard icon={Briefcase} label="Portfolios" value={stats.portfolios}
          accent={{ bg: 'rgba(45,212,191,0.12)', border: 'rgba(45,212,191,0.22)', color: '#2dd4bf', glow: 'rgba(45,212,191,0.35)' }} />
        <StatCard icon={TrendingUp} label="Precios actualizados" value={stats.precios}
          accent={{ bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.22)', color: '#34d399', glow: 'rgba(52,211,153,0.35)' }} />
      </div>

      {/* Prices table */}
      {precios.length > 0 && (
        <div className="dark-tbl-wrap">
          <div className="section-hdr">
            <span className="section-hdr-title">Últimos precios</span>
            <button onClick={() => navigate('/precios')} style={{ fontSize: 12, color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer' }}>
              Ver todos →
            </button>
          </div>
          <table className="dark-tbl">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Precio</th>
                <th>Variación</th>
                <th>Fuente</th>
              </tr>
            </thead>
            <tbody>
              {precios.map((p) => (
                <tr key={p.ticker}>
                  <td style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: '#c7d0e0', letterSpacing: '0.04em' }}>{p.ticker}</td>
                  <td className="mono" style={{ color: '#e2e8f0' }}>
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
                  <td style={{ color: '#717c91', textTransform: 'capitalize', fontSize: 12 }}>{p.fuente}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
