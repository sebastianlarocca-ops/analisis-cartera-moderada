import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Briefcase, DollarSign, TrendingUp } from 'lucide-react'
import api from '../api/client'
import { fmtARS, fmtUSD, fmtPct } from '../lib/utils'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={20} className="text-white" />
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
      setStats({
        clientes: c.data.data.length,
        portfolios: p.data.data.length,
        precios: pr.data.data.length,
      })
      setPrecios(pr.data.data.slice(0, 10))
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-slate-500 text-sm">Cargando...</div>

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Resumen general</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard icon={Users} label="Clientes activos" value={stats.clientes} color="bg-blue-500" />
        <StatCard icon={Briefcase} label="Portfolios" value={stats.portfolios} color="bg-violet-500" />
        <StatCard icon={DollarSign} label="Precios actualizados" value={stats.precios} color="bg-emerald-500" />
      </div>

      {precios.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-500" />
              Últimos precios
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Ticker</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Precio</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Variación</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Fuente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {precios.map((p) => (
                  <tr key={p.ticker} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-semibold text-slate-800">{p.ticker}</td>
                    <td className="px-6 py-3 text-right font-mono text-slate-700">
                      {p.moneda === 'USD' ? fmtUSD(p.precio) : fmtARS(p.precio)}
                    </td>
                    <td className={`px-6 py-3 text-right font-medium ${p.variacion_pct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {fmtPct(p.variacion_pct)}
                    </td>
                    <td className="px-6 py-3 text-slate-400 capitalize">{p.fuente}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
