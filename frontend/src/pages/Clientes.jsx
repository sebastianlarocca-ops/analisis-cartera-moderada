import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronRight, Search } from 'lucide-react'
import api from '../api/client'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'

const perfilVariant = { conservador: 'blue', moderado: 'yellow', agresivo: 'red' }
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

  const load = () => api.get('/clients').then((r) => setClientes(r.data.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await api.post('/clients', form)
      setModal(false); setForm(emptyForm); load()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear cliente')
    } finally { setSaving(false) }
  }

  const filtrados = clientes.filter((c) =>
    `${c.nombre} ${c.apellido} ${c.email}`.toLowerCase().includes(filtro.toLowerCase())
  )

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.02em' }}>Clientes</h1>
          <p style={{ fontSize: 12.5, color: '#8b94a8', marginTop: 3 }}>{clientes.length} clientes activos</p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <Plus size={15} /> Nuevo cliente
        </button>
      </div>

      <div className="dark-tbl-wrap">
        {/* Search */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717c91' }} />
            <input
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="dark-input"
              style={{ paddingLeft: 32 }}
            />
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Cargando...</div>
        ) : filtrados.length === 0 ? (
          <div className="empty-state">{filtro ? 'Sin resultados para esa búsqueda' : 'No hay clientes aún'}</div>
        ) : (
          <table className="dark-tbl">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Email</th>
                <th>Perfil</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => (
                <tr key={c._id} onClick={() => navigate(`/clientes/${c._id}`)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600, color: '#c7d0e0' }}>{c.nombre} {c.apellido}</td>
                  <td style={{ color: '#8b94a8' }}>{c.email}</td>
                  <td><Badge variant={perfilVariant[c.perfil_riesgo]}>{c.perfil_riesgo}</Badge></td>
                  <td style={{ textAlign: 'right' }}><ChevronRight size={15} color="#4a5568" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modal} onClose={() => { setModal(false); setForm(emptyForm); setError('') }} title="Nuevo cliente">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Input label="Nombre *" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
            <Input label="Apellido *" value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} required />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          <div>
            <label className="dark-label">Perfil de riesgo</label>
            <select value={form.perfil_riesgo} onChange={(e) => setForm({ ...form, perfil_riesgo: e.target.value })} className="dark-select">
              <option value="conservador">Conservador</option>
              <option value="moderado">Moderado</option>
              <option value="agresivo">Agresivo</option>
            </select>
          </div>
          <div>
            <label className="dark-label">Notas</label>
            <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={2} className="dark-textarea" />
          </div>
          {error && <p style={{ fontSize: 12, color: '#f87171' }}>{error}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
            <button type="button" className="btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Crear cliente'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
