import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Users, DollarSign, TrendingUp, LogOut } from 'lucide-react'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/precios', label: 'Precios', icon: DollarSign },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#060810' }}>
      <div className="noise" />

      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: 'rgba(6,8,16,0.97)',
        borderRight: '1px solid rgba(255,255,255,0.055)',
        display: 'flex', flexDirection: 'column',
        position: 'relative', zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: 'rgba(99,102,241,0.14)',
              border: '1px solid rgba(99,102,241,0.28)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px -4px rgba(99,102,241,0.4)',
            }}>
              <TrendingUp size={15} color="#818cf8" />
            </div>
            <div>
              <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13, letterSpacing: '-0.01em', lineHeight: 1.3 }}>Cartera</div>
              <div style={{ color: '#8b94a8', fontSize: 9.5, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Moderada</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => isActive ? 'nav-active' : 'nav-item'}
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.055)' }}>
          <div style={{ color: '#8b94a8', fontSize: 11, marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </div>
          <button
            className="back-link"
            onClick={() => { logout(); navigate('/login') }}
          >
            <LogOut size={13} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 10 }} className="page-bg">
        <Outlet />
      </main>
    </div>
  )
}
