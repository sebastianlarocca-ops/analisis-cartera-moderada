import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, ChevronRight, Mail, Phone } from 'lucide-react'
import api from '../api/client'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'

const perfilVariant = { conservador: 'blue', moderado: 'yellow', agresivo: 'red' }

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
    const [c, p] = await Promise.all([api.get(`/clients/${id}`), api.get(`/portfolios?client_id=${id}`)])
    setCliente(c.data.data); setPortfolios(p.data.data); setLoading(false)
  }
  useEffect(() => { load() }, [id])

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await api.post('/portfolios', { ...form, client_id: id })
      setModal(false); setForm({ nombre: '', descripcion: '', moneda_base: 'ARS' }); load()
    } catch (err) { setError(err.response?.data?.message || 'Error al crear portfolio') }
    finally { setSaving(false) }
  }

  if (loading) return <div style={{ padding: 32, color: '#717c91', fontSize: 13 }}>Cargando...</div>
  if (!cliente) return <div style={{ padding: 32, color: '#717c91', fontSize: 13 }}>Cliente no encontrado</div>

  return (
    <div style={{ padding: 32 }}>
      <button className="back-link" onClick={() => navigate('/clientes')} style={{ marginBottom: 24 }}>
        <ArrowLeft size={14} /> Volver a clientes
      </button>

      {/* Cliente header */}
      <div className="glass" style={{ padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.02em' }}>
              {cliente.nombre} {cliente.apellido}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
              {cliente.email && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#8b94a8' }}>
                  <Mail size={12} /> {cliente.email}
                </span>
              )}
              {cliente.telefono && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#8b94a8' }}>
                  <Phone size={12} /> {cliente.telefono}
                </span>
              )}
            </div>
            {cliente.notas && <p style={{ fontSize: 12.5, color: '#8b94a8', marginTop: 8 }}>{cliente.notas}</p>}
          </div>
          <Badge variant={perfilVariant[cliente.perfil_riesgo]}>{cliente.perfil_riesgo}</Badge>
        </div>
      </div>

      {/* Portfolios header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#c7d0e0' }}>Portfolios</span>
          <span style={{ fontSize: 12, color: '#717c91', marginLeft: 8 }}>({portfolios.length})</span>
        </div>
        <button className="btn-primary" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => setModal(true)}>
          <Plus size={13} /> Nuevo portfolio
        </button>
      </div>

      {portfolios.length === 0 ? (
        <div className="glass empty-state">Este cliente no tiene portfolios aún</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {portfolios.map((p) => (
            <div
              key={p._id}
              onClick={() => navigate(`/portfolios/${p._id}`)}
              className="glass"
              style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'border-color .18s' }}
            >
              <div>
                <p style={{ fontWeight: 600, color: '#c7d0e0', fontSize: 14 }}>{p.nombre}</p>
                {p.descripcion && <p style={{ fontSize: 11.5, color: '#8b94a8', marginTop: 2 }}>{p.descripcion}</p>}
                <p style={{ fontSize: 11, color: '#717c91', marginTop: 6 }}>
                  {p.positions?.length ?? 0} posiciones · {p.moneda_base}
                </p>
              </div>
              <ChevronRight size={16} color="#4a5568" />
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => { setModal(false); setError('') }} title="Nuevo portfolio">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Nombre *" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Cartera Moderada 2025" required />
          <div>
            <label className="dark-label">Descripción</label>
            <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={2} className="dark-textarea" />
          </div>
          <div>
            <label className="dark-label">Moneda base</label>
            <select value={form.moneda_base} onChange={(e) => setForm({ ...form, moneda_base: e.target.value })} className="dark-select">
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
          </div>
          {error && <p style={{ fontSize: 12, color: '#f87171' }}>{error}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
            <button type="button" className="btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Creando...' : 'Crear portfolio'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
