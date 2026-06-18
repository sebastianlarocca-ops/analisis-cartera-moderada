import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, ChevronRight, Mail, Phone } from 'lucide-react'
import api from '../api/client'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'

const perfilColor = { conservador: 'blue', moderado: 'yellow', agresivo: 'red' }

export default function ClienteDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cliente, setCliente] = useState(null)
  const [portfolios, setPortfolios] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ nombre: '', descripcion: '', moneda_base: 'ARS' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const [c, p] = await Promise.all([
      api.get(`/clients/${id}`),
      api.get(`/portfolios?client_id=${id}`),
    ])
    setCliente(c.data.data)
    setPortfolios(p.data.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/portfolios', { ...form, client_id: id })
      setModal(false)
      setForm({ nombre: '', descripcion: '', moneda_base: 'ARS' })
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear portfolio')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-slate-500 text-sm">Cargando...</div>
  if (!cliente) return <div className="p-8 text-slate-500 text-sm">Cliente no encontrado</div>

  return (
    <div className="p-8">
      <button
        onClick={() => navigate('/clientes')}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft size={15} /> Volver a clientes
      </button>

      {/* Header del cliente */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{cliente.nombre} {cliente.apellido}</h1>
            <div className="flex items-center gap-4 mt-2">
              {cliente.email && (
                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Mail size={13} /> {cliente.email}
                </span>
              )}
              {cliente.telefono && (
                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Phone size={13} /> {cliente.telefono}
                </span>
              )}
            </div>
            {cliente.notas && <p className="text-sm text-slate-500 mt-2">{cliente.notas}</p>}
          </div>
          <Badge variant={perfilColor[cliente.perfil_riesgo]}>{cliente.perfil_riesgo}</Badge>
        </div>
      </div>

      {/* Portfolios */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-slate-800">
          Portfolios <span className="text-slate-400 font-normal text-sm">({portfolios.length})</span>
        </h2>
        <Button size="sm" onClick={() => setModal(true)}>
          <Plus size={14} /> Nuevo portfolio
        </Button>
      </div>

      {portfolios.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-400 text-sm">
          Este cliente no tiene portfolios aún
        </div>
      ) : (
        <div className="space-y-3">
          {portfolios.map((p) => (
            <div
              key={p._id}
              onClick={() => navigate(`/portfolios/${p._id}`)}
              className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex items-center justify-between cursor-pointer hover:border-blue-300 transition-colors"
            >
              <div>
                <p className="font-medium text-slate-800">{p.nombre}</p>
                {p.descripcion && <p className="text-xs text-slate-400 mt-0.5">{p.descripcion}</p>}
                <p className="text-xs text-slate-400 mt-1">
                  {p.positions?.length ?? 0} posiciones · {p.moneda_base}
                </p>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => { setModal(false); setError('') }} title="Nuevo portfolio">
        <form onSubmit={handleCreate} className="space-y-3">
          <Input
            label="Nombre *"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Ej: Cartera Moderada 2025"
            required
          />
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              rows={2}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">Moneda base</label>
            <select
              value={form.moneda_base}
              onChange={(e) => setForm({ ...form, moneda_base: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
          </div>
          {error && <p className="text-red-600 text-xs">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Creando...' : 'Crear portfolio'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
