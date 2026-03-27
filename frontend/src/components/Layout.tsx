import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { path: '/', label: 'Tableau de bord', icon: '⊞' },
  { path: '/civils', label: 'Fiches Civils', icon: '👤' },
  { path: '/amendes', label: 'Amendes', icon: '💶' },
  { path: '/gav', label: 'Gardes à Vue', icon: '🔒' },
  { path: '/pv', label: 'Procès-Verbaux', icon: '📋' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-gend-card border-r border-gend-border flex flex-col transition-all duration-300 flex-shrink-0`}>
        {/* Logo */}
        <div className="p-4 border-b border-gend-border flex items-center gap-3">
          <div className="w-8 h-8 bg-gend-blue rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">G</div>
          {sidebarOpen && (
            <div>
              <div className="text-white font-bold text-sm leading-tight">GENDARMERIE</div>
              <div className="text-gend-gold text-xs">Pacifique RP</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                location.pathname === item.path
                  ? 'bg-gend-blue text-white'
                  : 'text-gray-400 hover:bg-gend-border hover:text-white'
              }`}
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                location.pathname === '/admin'
                  ? 'bg-gend-blue text-white'
                  : 'text-gray-400 hover:bg-gend-border hover:text-white'
              }`}
            >
              <span className="text-base flex-shrink-0">⚙️</span>
              {sidebarOpen && <span>Administration</span>}
            </Link>
          )}
        </nav>

        {/* User + toggle */}
        <div className="p-3 border-t border-gend-border space-y-2">
          {sidebarOpen && (
            <div className="px-3 py-2 bg-gend-darker rounded-lg">
              <div className="text-white text-sm font-medium truncate">{user?.username}</div>
              <div className="text-gray-400 text-xs">{user?.grade || user?.role}</div>
              {user?.matricule && <div className="text-gend-gold text-xs">{user.matricule}</div>}
            </div>
          )}
          <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors text-sm`}>
            <span>🚪</span>
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full flex items-center justify-center py-1 text-gray-500 hover:text-gray-300 text-xs">
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
