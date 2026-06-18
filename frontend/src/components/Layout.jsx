import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Users, TrendingUp, DollarSign, LogOut } from 'lucide-react'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/precios', label: 'Precios', icon: DollarSign },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-blue-400" size={20} />
            <span className="text-white font-semibold text-sm">Cartera Moderada</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-slate-700">
          <div className="text-slate-400 text-xs mb-3 truncate">{user?.email}</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors w-full"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
