import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import client from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import StatCard from '../components/StatCard'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function Dashboard() {
  const { user } = useAuth()
  const { data: stats } = useQuery({ queryKey: ['dashboard-stats'], queryFn: () => client.get('/dashboard/stats').then(r => r.data) })
  const { data: recent } = useQuery({ queryKey: ['dashboard-recent'], queryFn: () => client.get('/dashboard/recent').then(r => r.data) })

  const now = new Date()

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
          <span>{format(now, 'EEEE d MMMM yyyy', { locale: fr })}</span>
          <span>—</span>
          <span>{format(now, 'HH:mm')}</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Bonjour, {user?.grade ? `${user.grade} ` : ''}{user?.username}</h1>
        {user?.matricule && <div className="text-gend-gold text-sm">{user.matricule}</div>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard label="Civils enregistrés" value={stats?.civils ?? '—'} icon="👤" color="blue" />
        <StatCard label="Amendes aujourd'hui" value={stats?.amendes_today ?? '—'} icon="💶" color="yellow" />
        <StatCard label="GAV en cours" value={stats?.gav_en_cours ?? '—'} icon="🔒" color="red" />
        <StatCard label="PV aujourd'hui" value={stats?.pv_today ?? '—'} icon="📋" color="blue" />
        <StatCard label="Amendes impayées" value={stats?.amendes_non_payees ?? '—'} icon="⚠️" color="yellow" />
        <StatCard label="PV total" value={stats?.pv_total ?? '—'} icon="📁" color="green" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { to: '/civils', label: 'Nouvelle fiche civil', icon: '👤', color: 'bg-blue-800' },
          { to: '/amendes', label: 'Créer une amende', icon: '💶', color: 'bg-yellow-800' },
          { to: '/gav', label: 'Ouvrir une GAV', icon: '🔒', color: 'bg-red-800' },
          { to: '/pv', label: 'Rédiger un PV', icon: '📋', color: 'bg-green-800' },
        ].map(a => (
          <Link key={a.to} to={a.to} className={`${a.color} hover:opacity-90 text-white rounded-xl p-4 flex items-center gap-3 font-medium transition-opacity`}>
            <span className="text-2xl">{a.icon}</span>
            <span className="text-sm">{a.label}</span>
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent fines */}
        <div className="card">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">💶 Mes dernières amendes</h3>
          {recent?.recent_fines?.length === 0 && <p className="text-gray-500 text-sm">Aucune amende récente</p>}
          <div className="space-y-2">
            {recent?.recent_fines?.map((f: any) => (
              <Link to="/amendes" key={f.id} className="block bg-gend-darker rounded-lg p-3 hover:bg-gend-border transition-colors">
                <div className="flex justify-between items-start">
                  <div className="text-sm text-white font-medium">{f.prenom} {f.nom}</div>
                  <div className="text-yellow-400 font-bold text-sm">{f.montant}€</div>
                </div>
                <div className="text-gray-400 text-xs mt-1 truncate">{f.motif}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent GAV */}
        <div className="card">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">🔒 Mes dernières GAV</h3>
          {recent?.recent_gav?.length === 0 && <p className="text-gray-500 text-sm">Aucune GAV récente</p>}
          <div className="space-y-2">
            {recent?.recent_gav?.map((g: any) => (
              <Link to="/gav" key={g.id} className="block bg-gend-darker rounded-lg p-3 hover:bg-gend-border transition-colors">
                <div className="flex justify-between items-start">
                  <div className="text-sm text-white font-medium">{g.prenom} {g.nom}</div>
                  <span className={g.statut === 'en_cours' ? 'badge-red' : 'badge-gray'}>{g.statut === 'en_cours' ? 'En cours' : 'Terminée'}</span>
                </div>
                <div className="text-gray-400 text-xs mt-1 truncate">{g.motif}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent PV */}
        <div className="card">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">📋 Mes derniers PV</h3>
          {recent?.recent_pv?.length === 0 && <p className="text-gray-500 text-sm">Aucun PV récent</p>}
          <div className="space-y-2">
            {recent?.recent_pv?.map((p: any) => (
              <Link to={`/pv/${p.id}`} key={p.id} className="block bg-gend-darker rounded-lg p-3 hover:bg-gend-border transition-colors">
                <div className="flex justify-between items-start">
                  <div className="text-xs text-gend-gold font-mono">{p.numero}</div>
                  <span className={p.statut === 'finalisé' ? 'badge-green' : p.statut === 'classé' ? 'badge-gray' : 'badge-yellow'}>{p.statut}</span>
                </div>
                <div className="text-sm text-white font-medium mt-1 truncate">{p.titre}</div>
                <div className="text-gray-400 text-xs">{p.prenom} {p.nom}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
