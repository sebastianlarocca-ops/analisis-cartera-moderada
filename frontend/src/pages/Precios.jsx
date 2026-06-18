import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import api from '../api/client'
import Button from '../components/ui/Button'
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
    try {
      await api.post('/prices/update')
      await load()
    } catch (e) {
      console.error(e)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Precios de mercado</h1>
          {updatedAt && (
            <p className="text-xs text-slate-400 mt-0.5">
              Última actualización: {new Date(updatedAt).toLocaleString('es-AR')}
            </p>
          )}
        </div>
        <Button variant="outline" onClick={handleUpdate} disabled={updating}>
          <RefreshCw size={14} className={updating ? 'animate-spin' : ''} />
          {updating ? 'Actualizando...' : 'Actualizar ahora'}
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        {loading ? (
          <div className="px-6 py-8 text-center text-slate-400 text-sm">Cargando...</div>
        ) : precios.length === 0 ? (
          <div className="px-6 py-8 text-center text-slate-400 text-sm">
            Sin precios. Ejecutá una actualización o esperá el cron automático.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Ticker', 'Precio', 'Variación', 'Moneda', 'Fuente', 'Mercado'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide first:pl-6 last:pr-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {precios.map((p) => (
                  <tr key={p.ticker} className="hover:bg-slate-50">
                    <td className="pl-6 pr-5 py-3 font-bold text-slate-800">{p.ticker}</td>
                    <td className="px-5 py-3 font-mono font-medium text-slate-800">
                      {p.moneda === 'USD' ? fmtUSD(p.precio) : fmtARS(p.precio)}
                    </td>
                    <td className={`px-5 py-3 font-medium ${p.variacion_pct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {fmtPct(p.variacion_pct)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={p.moneda === 'USD' ? 'green' : 'blue'}>{p.moneda}</Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-500 capitalize">{p.fuente}</td>
                    <td className="pr-6 pl-5 py-3">
                      <Badge variant={p.mercado_abierto ? 'green' : 'default'}>
                        {p.mercado_abierto ? 'Abierto' : 'Cerrado'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
