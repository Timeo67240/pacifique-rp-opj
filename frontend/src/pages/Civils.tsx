import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import client from '../api/client'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import { format } from 'date-fns'

const STATUTS = ['actif', 'recherché', 'interdit_séjour', 'archivé']
const STATUT_BADGE: Record<string, string> = {
  actif: 'badge-green',
  recherché: 'badge-red',
  interdit_séjour: 'badge-yellow',
  archivé: 'badge-gray',
}

function CivilForm({ initial, onSubmit, loading }: any) {
  const [form, setForm] = useState(initial || { nom: '', prenom: '', date_naissance: '', nationalite: 'Française', adresse: '', roblox_username: '', telephone: '', profession: '', antecedents: '', statut: 'actif', notes: '' })
  const set = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Nom *</label><input className="input" value={form.nom} onChange={e => set('nom', e.target.value)} required /></div>
        <div><label className="label">Prénom *</label><input className="input" value={form.prenom} onChange={e => set('prenom', e.target.value)} required /></div>
        <div><label className="label">Date de naissance</label><input className="input" type="date" value={form.date_naissance || ''} onChange={e => set('date_naissance', e.target.value)} /></div>
        <div><label className="label">Nationalité</label><input className="input" value={form.nationalite} onChange={e => set('nationalite', e.target.value)} /></div>
        <div><label className="label">Username Roblox</label><input className="input" value={form.roblox_username || ''} onChange={e => set('roblox_username', e.target.value)} /></div>
        <div><label className="label">Téléphone</label><input className="input" value={form.telephone || ''} onChange={e => set('telephone', e.target.value)} /></div>
        <div className="col-span-2"><label className="label">Adresse</label><input className="input" value={form.adresse || ''} onChange={e => set('adresse', e.target.value)} /></div>
        <div><label className="label">Profession</label><input className="input" value={form.profession || ''} onChange={e => set('profession', e.target.value)} /></div>
        <div><label className="label">Statut</label>
          <select className="input" value={form.statut} onChange={e => set('statut', e.target.value)}>
            {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-span-2"><label className="label">Antécédents judiciaires</label><textarea className="input" rows={3} value={form.antecedents || ''} onChange={e => set('antecedents', e.target.value)} /></div>
        <div className="col-span-2"><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes || ''} onChange={e => set('notes', e.target.value)} /></div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Enregistrement...' : 'Enregistrer'}</button>
      </div>
    </form>
  )
}

export default function CivilsPage() {
  const [search, setSearch] = useState('')
  const [statut, setStatut] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const qc = useQueryClient()

  const { data: civils, isLoading } = useQuery({
    queryKey: ['civils', search, statut],
    queryFn: () => client.get('/civilians', { params: { q: search || undefined, statut: statut || undefined } }).then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => client.post('/civilians', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['civils'] }); setShowCreate(false) },
  })

  return (
    <div className="p-6">
      <PageHeader
        title="Fiches Civils"
        subtitle={`${civils?.length ?? 0} civil(s) enregistré(s)`}
        actions={<button onClick={() => setShowCreate(true)} className="btn-primary">+ Nouveau civil</button>}
      />

      {/* Search */}
      <div className="card mb-6 flex gap-3 flex-wrap">
        <input className="input flex-1 min-w-48" placeholder="Recherche par nom, prénom, Roblox username..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input w-48" value={statut} onChange={e => setStatut(e.target.value)}>
          <option value="">Tous les statuts</option>
          {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        {isLoading ? <div className="text-gray-400 text-center py-8">Chargement...</div> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gend-border text-gray-400 text-left text-xs uppercase tracking-wider">
                <th className="pb-3 pr-4">Identité</th>
                <th className="pb-3 pr-4">Roblox</th>
                <th className="pb-3 pr-4">Nationalité</th>
                <th className="pb-3 pr-4">Profession</th>
                <th className="pb-3 pr-4">Statut</th>
                <th className="pb-3">Enregistré le</th>
              </tr>
            </thead>
            <tbody>
              {civils?.length === 0 && (
                <tr><td colSpan={6} className="text-center text-gray-500 py-8">Aucun civil trouvé</td></tr>
              )}
              {civils?.map((c: any) => (
                <tr key={c.id} className="border-b border-gend-border/50 hover:bg-gend-border/30 transition-colors">
                  <td className="py-3 pr-4">
                    <Link to={`/civils/${c.id}`} className="text-white font-medium hover:text-blue-400">{c.nom} {c.prenom}</Link>
                  </td>
                  <td className="py-3 pr-4 text-gray-300">{c.roblox_username || '—'}</td>
                  <td className="py-3 pr-4 text-gray-300">{c.nationalite}</td>
                  <td className="py-3 pr-4 text-gray-300">{c.profession || '—'}</td>
                  <td className="py-3 pr-4"><span className={STATUT_BADGE[c.statut] || 'badge-gray'}>{c.statut}</span></td>
                  <td className="py-3 text-gray-400 text-xs">{c.created_at ? format(new Date(c.created_at), 'dd/MM/yyyy') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nouveau civil" size="lg">
        <CivilForm onSubmit={(d: any) => createMutation.mutate(d)} loading={createMutation.isPending} />
      </Modal>
    </div>
  )
}
