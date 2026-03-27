import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAuth } from '../contexts/AuthContext'

const GRADES = [
  // Sous-officiers
  'Gendarme', 'Gendarme de 1ère Classe', 'Brigadier', 'Brigadier-Chef',
  'Maréchal des Logis', 'Maréchal des Logis-Chef', 'Adjudant', 'Adjudant-Chef', 'Major',
  // Officiers
  'Lieutenant', 'Capitaine', 'Commandant', 'Lieutenant-Colonel', 'Colonel',
  // Généraux
  'Général de Brigade', 'Général de Division', "Général de Corps d'Armée",
  "Général d'Armée", "Général d'Armée (5 étoiles)"
]

export default function AdminPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [approveModal, setApproveModal] = useState<any>(null)
  const [approveData, setApproveData] = useState({ role: 'opj', grade: '', matricule: '' })
  const [form, setForm] = useState({ username: '', password: '', role: 'opj', grade: '', matricule: '' })
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => client.get('/auth/users').then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => client.post('/auth/users', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setShowCreate(false); setForm({ username: '', password: '', role: 'opj', grade: '', matricule: '' }); setError('') },
    onError: (e: any) => setError(e.response?.data?.error || 'Erreur'),
  })

  const approveMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => client.patch(`/auth/users/${id}/approve`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setApproveModal(null) },
  })

  const rejectMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/auth/users/${id}/reject`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: any) => client.patch(`/auth/users/${id}`, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  const roleGradeMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => client.patch(`/auth/users/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  const pendingUsers = users?.filter((u: any) => u.status === 'pending') || []
  const activeUsers = users?.filter((u: any) => u.status === 'active') || []
  const inactiveUsers = users?.filter((u: any) => u.status === 'disabled') || []

  return (
    <div className="p-6">
      <PageHeader
        title="Administration"
        subtitle={`${activeUsers.length} compte(s) actif(s)${pendingUsers.length > 0 ? ` — ${pendingUsers.length} en attente` : ''}`}
        actions={<button onClick={() => setShowCreate(true)} className="btn-primary">+ Nouveau compte</button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          ['Comptes actifs', activeUsers.length, 'green'],
          ['En attente', pendingUsers.length, pendingUsers.length > 0 ? 'yellow' : 'blue'],
          ['Administrateurs', users?.filter((u: any) => u.role === 'admin' && u.status === 'active').length || 0, 'blue'],
          ['OPJ actifs', users?.filter((u: any) => u.role === 'opj' && u.status === 'active').length || 0, 'gold'],
        ].map(([l, v, c]) => (
          <div key={String(l)} className={`card border ${c === 'green' ? 'border-green-700' : c === 'blue' ? 'border-blue-700' : c === 'yellow' ? 'border-yellow-600' : 'border-yellow-700'}`}>
            <div className="text-gray-400 text-xs uppercase tracking-wider">{l}</div>
            <div className="text-3xl font-bold text-white mt-1">{v}</div>
          </div>
        ))}
      </div>

      {/* DEMANDES EN ATTENTE */}
      {pendingUsers.length > 0 && (
        <div className="card mb-6 border border-yellow-700">
          <h3 className="text-yellow-400 font-bold mb-4 flex items-center gap-2">
            ⏳ Demandes d'accès en attente ({pendingUsers.length})
          </h3>
          <div className="space-y-3">
            {pendingUsers.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between bg-gend-darker rounded-lg px-4 py-3 border border-yellow-800/40">
                <div>
                  <div className="text-white font-semibold">{u.username}</div>
                  <div className="text-gray-400 text-xs mt-0.5">
                    Grade souhaité : <span className="text-gray-300">{u.grade || '—'}</span>
                    {' · '}Demande le {u.created_at ? format(new Date(u.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr }) : '—'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setApproveModal(u); setApproveData({ role: 'opj', grade: u.grade || '', matricule: '' }) }}
                    className="text-sm bg-green-900 hover:bg-green-800 text-green-300 px-3 py-1.5 rounded-lg font-medium"
                  >✓ Valider</button>
                  <button
                    onClick={() => { if (confirm(`Rejeter la demande de ${u.username} ?`)) rejectMutation.mutate(u.id) }}
                    className="text-sm bg-red-900 hover:bg-red-800 text-red-300 px-3 py-1.5 rounded-lg font-medium"
                  >✕ Refuser</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comptes actifs */}
      <div className="card overflow-x-auto mb-6">
        <h3 className="text-white font-bold mb-4">Comptes actifs</h3>
        {isLoading ? <div className="text-gray-400">Chargement...</div> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gend-border text-gray-400 text-xs uppercase tracking-wider text-left">
                <th className="pb-3 pr-4">Identifiant</th>
                <th className="pb-3 pr-4">Grade</th>
                <th className="pb-3 pr-4">Matricule</th>
                <th className="pb-3 pr-4">Rôle</th>
                <th className="pb-3 pr-4">Créé le</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeUsers.map((u: any) => (
                <tr key={u.id} className="border-b border-gend-border/50 hover:bg-gend-border/30 transition-colors">
                  <td className="py-3 pr-4 text-white font-medium">{u.username} {u.id === user?.id && <span className="text-xs text-gend-gold">(vous)</span>}</td>
                  <td className="py-3 pr-4">
                    <select className="bg-gend-darker border border-gend-border text-gray-300 text-xs rounded px-2 py-1 max-w-48" value={u.grade || ''} onChange={e => roleGradeMutation.mutate({ id: u.id, grade: e.target.value })} disabled={u.id === user?.id}>
                      <option value="">— Grade —</option>
                      {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </td>
                  <td className="py-3 pr-4 text-gray-300 font-mono text-xs">{u.matricule || '—'}</td>
                  <td className="py-3 pr-4">
                    <select className="bg-gend-darker border border-gend-border text-gray-300 text-xs rounded px-2 py-1" value={u.role} onChange={e => roleGradeMutation.mutate({ id: u.id, role: e.target.value })} disabled={u.id === user?.id}>
                      <option value="opj">OPJ</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="py-3 pr-4 text-gray-400 text-xs">{u.created_at ? format(new Date(u.created_at), 'dd/MM/yyyy', { locale: fr }) : '—'}</td>
                  <td className="py-3">
                    {u.id !== user?.id && (
                      <button onClick={() => { if (confirm(`Désactiver ${u.username} ?`)) toggleMutation.mutate({ id: u.id, active: false }) }} className="text-xs bg-red-900 hover:bg-red-800 text-red-300 px-3 py-1 rounded">Désactiver</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Comptes désactivés */}
      {inactiveUsers.length > 0 && (
        <div className="card">
          <h3 className="text-gray-400 font-bold mb-4 text-sm">Comptes désactivés ({inactiveUsers.length})</h3>
          <div className="space-y-2">
            {inactiveUsers.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between bg-gend-darker rounded-lg px-4 py-2">
                <div className="text-gray-500 text-sm">{u.username} — {u.grade} — {u.role}</div>
                <button onClick={() => toggleMutation.mutate({ id: u.id, active: true })} className="text-xs bg-green-900 hover:bg-green-800 text-green-300 px-3 py-1 rounded">Réactiver</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal validation */}
      <Modal open={!!approveModal} onClose={() => setApproveModal(null)} title={`Valider le compte de ${approveModal?.username}`}>
        <form onSubmit={e => { e.preventDefault(); approveMutation.mutate({ id: approveModal.id, ...approveData }) }} className="space-y-4">
          <div className="bg-blue-900/30 border border-blue-700/50 text-blue-300 rounded-lg px-4 py-3 text-sm">
            Vous allez activer le compte de <strong>{approveModal?.username}</strong>. Définissez son rôle et son grade.
          </div>
          <div><label className="label">Rôle *</label>
            <select className="input" value={approveData.role} onChange={e => setApproveData(d => ({ ...d, role: e.target.value }))}>
              <option value="opj">OPJ</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
          <div><label className="label">Grade</label>
            <select className="input" value={approveData.grade} onChange={e => setApproveData(d => ({ ...d, grade: e.target.value }))}>
              <option value="">— Sélectionner —</option>
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div><label className="label">Matricule</label>
            <input className="input" value={approveData.matricule} onChange={e => setApproveData(d => ({ ...d, matricule: e.target.value }))} placeholder="Ex: OPJ-042" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setApproveModal(null)} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={approveMutation.isPending} className="btn-success">Valider le compte</button>
          </div>
        </form>
      </Modal>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Créer un compte directement" size="md">
        <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form) }} className="space-y-4">
          <div><label className="label">Identifiant *</label><input className="input" value={form.username} onChange={e => set('username', e.target.value)} required /></div>
          <div><label className="label">Mot de passe *</label><input className="input" type="password" value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} /></div>
          <div><label className="label">Rôle *</label>
            <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
              <option value="opj">OPJ</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
          <div><label className="label">Grade</label>
            <select className="input" value={form.grade} onChange={e => set('grade', e.target.value)}>
              <option value="">— Sélectionner un grade —</option>
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div><label className="label">Matricule</label><input className="input" value={form.matricule} onChange={e => set('matricule', e.target.value)} placeholder="Ex: MAT-001" /></div>
          {error && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded px-3 py-2 text-sm">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">Créer le compte</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
