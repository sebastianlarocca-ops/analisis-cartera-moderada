import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronRight, Search } from 'lucide-react'
import api from '../api/client'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'

const perfilColor = { conservador: 'blue', moderado: 'yellow', agresivo: 'red' }

const emptyForm = { nombre: '', apellido: '', email: '', telefono: '', perfil_riesgo: 'moderado', notas: '' }

export default function Clientes() {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState([])
  const [filtro, setFiltro] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () =>
    api.get('/clients').then((r) => setClientes(r.data.data)).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/clients', form)
      setModal(false)
      setForm(emptyForm)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear cliente')
    } finally {
      setSaving(false)
    }
  }

  const filtrados = clientes.filter((c) =>
    `${c.nombre} ${c.apellido} ${c.email}`.toLowerCase().includes(filtro.toLowerCase())
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500 mt-0.5">{clientes.length} clientes activos</p>
        </div>
        <Button onClick={() => setModal(true)}>
          <Plus size={16} /> Nuevo cliente
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="px-6 py-3 border-b border-slate-100">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="w-full pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="px-6 py-8 text-center text-slate-400 text-sm">Cargando...</div>
        ) : filtrados.length === 0 ? (
          <div className="px-6 py-8 text-center text-slate-400 text-sm">
            {filtro ? 'Sin resultados para esa búsqueda' : 'No hay clientes aún'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Cliente</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Perfil</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtrados.map((c) => (
                <tr
                  key={c._id}
                  onClick={() => navigate(`/clientes/${c._id}`)}
                  className="hover:bg-slate-50 cursor-pointer"
                >
                  <td className="px-6 py-3 font-medium text-slate-800">{c.nombre} {c.apellido}</td>
                  <td className="px-6 py-3 text-slate-500">{c.email}</td>
                  <td className="px-6 py-3">
                    <Badge variant={perfilColor[c.perfil_riesgo]}>
                      {c.perfil_riesgo}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <ChevronRight size={16} className="text-slate-300 ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modal} onClose={() => { setModal(false); setForm(emptyForm); setError('') }} title="Nuevo cliente">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nombre *" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
            <Input label="Apellido *" value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} required />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">Perfil de riesgo</label>
            <select
              value={form.perfil_riesgo}
              onChange={(e) => setForm({ ...form, perfil_riesgo: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="conservador">Conservador</option>
              <option value="moderado">Moderado</option>
              <option value="agresivo">Agresivo</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">Notas</label>
            <textarea
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
              rows={2}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          {error && <p className="text-red-600 text-xs">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Crear cliente'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
