import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { TrendingUp } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="noise" />
      <div style={{ width: '100%', maxWidth: 360, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 52, height: 52, borderRadius: 14,
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.3)',
            boxShadow: '0 0 30px -4px rgba(99,102,241,0.5)',
            marginBottom: 16,
          }}>
            <TrendingUp size={22} color="#818cf8" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Cartera Moderada
          </h1>
          <p style={{ fontSize: 13, color: '#8b94a8' }}>Panel del Asesor</p>
        </div>

        {/* Card */}
        <div className="glass" style={{ padding: '28px 28px 24px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="dark-label">Email</label>
              <input
                type="email" required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="dark-input"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="dark-label">Contraseña</label>
              <input
                type="password" required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="dark-input"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p style={{ fontSize: 12, color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6, padding: '6px 10px' }}>
                {error}
              </p>
            )}
            <button type="submit" disabled={loading} className="btn-primary" style={{ justifyContent: 'center', marginTop: 4, padding: '10px' }}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
