import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAuth } from '../contexts/AuthContext'

const MOTIFS = [
  'Excès de vitesse', 'Stationnement interdit', 'Refus d\'obtempérer', 'Conduite sans permis',
  'Conduite sans assurance', 'Alcool au volant', 'Usage de stupéfiants', 'Trouble à l\'ordre public',
  'Voie de fait', 'Port d\'arme illégal', 'Recel', 'Trafic de stupéfiants', 'Autre infraction'
]

const STATUT_BADGE: Record<string, string> = {
  payée: 'badge-green', non_payée: 'badge-red', contestée: 'badge-yellow', annulée: 'badge-gray'
}

function fmt(d: string) { try { return format(new Date(d), 'dd/MM/yyyy HH:mm', { locale: fr }) } catch { return d } }

export default function AmendePage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [filterStatut, setFilterStatut] = useState('')
  const [filterMine, setFilterMine] = useState(false)

  // Civilian search for form
  const [civilSearch, setCivilSearch] = useState('')
  const [form, setForm] = useState({ civilian_id: '', montant: '', motif: '', details: '', localisation: '' })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { data: amendes, isLoading } = useQuery({
    queryKey: ['amendes', filterStatut, filterMine],
    queryFn: () => client.get('/fines', {
      params: {
        statut: filterStatut || undefined,
        officer_id: filterMine ? user?.id : undefined
      }
    }).then(r => r.data),
  })

  const { data: civils } = useQuery({
    queryKey: ['civils-search', civilSearch],
    queryFn: () => client.get('/civilians', { params: { q: civilSearch || undefined } }).then(r => r.data),
    enabled: civilSearch.length > 1,
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => client.post('/fines', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['amendes'] }); setShowCreate(false); setForm({ civilian_id: '', montant: '', motif: '', details: '', localisation: '' }) },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, statut }: any) => client.patch(`/fines/${id}/statut`, { statut }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['amendes'] }),
  })

  const total_montant = amendes?.filter((a: any) => a.statut === 'payée').reduce((acc: number, a: any) => acc + a.montant, 0) || 0

  return (
    <div className="p-6">
      <PageHeader
        title="Amendes"
        subtitle={`${amendes?.length ?? 0} amende(s) — ${total_montant}€ encaissé(s)`}
        actions={<button onClick={() => setShowCreate(true)} className="btn-primary">+ Nouvelle amende</button>}
      />

      {/* Filters */}
      <div className="card mb-6 flex gap-3 flex-wrap items-center">
        <select className="input w-48" value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="non_payée">Non payée</option>
          <option value="payée">Payée</option>
          <option value="contestée">Contestée</option>
          <option value="annulée">Annulée</option>
        </select>
        <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
          <input type="checkbox" checked={filterMine} onChange={e => setFilterMine(e.target.checked)} className="accent-blue-500" />
          Mes amendes uniquement
        </label>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        {isLoading ? <div className="text-gray-400 text-center py-8">Chargement...</div> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gend-border text-gray-400 text-xs uppercase tracking-wider text-left">
                <th className="pb-3 pr-4">Civil</th>
                <th className="pb-3 pr-4">Motif</th>
                <th className="pb-3 pr-4">Montant</th>
                <th className="pb-3 pr-4">Officier</th>
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Statut</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {amendes?.length === 0 && <tr><td colSpan={7} className="text-center text-gray-500 py-8">Aucune amende</td></tr>}
              {amendes?.map((a: any) => (
                <tr key={a.id} className="border-b border-gend-border/50 hover:bg-gend-border/30 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="text-white font-medium">{a.prenom} {a.nom}</div>
                    {a.roblox_username && <div className="text-gray-500 text-xs">{a.roblox_username}</div>}
                  </td>
                  <td className="py-3 pr-4 text-gray-300 max-w-xs">
                    <div className="truncate">{a.motif}</div>
                    {a.details && <div className="text-gray-500 text-xs truncate">{a.details}</div>}
                  </td>
                  <td className="py-3 pr-4 text-yellow-400 font-bold">{a.montant}€</td>
                  <td className="py-3 pr-4 text-gray-300">
                    <div>{a.officer_name}</div>
                    {a.grade && <div className="text-gray-500 text-xs">{a.grade}</div>}
                  </td>
                  <td className="py-3 pr-4 text-gray-400 text-xs">{fmt(a.date)}</td>
                  <td className="py-3 pr-4"><span className={STATUT_BADGE[a.statut] || 'badge-gray'}>{a.statut}</span></td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      {a.statut === 'non_payée' && (
                        <button onClick={() => statusMutation.mutate({ id: a.id, statut: 'payée' })} className="text-xs bg-green-900 hover:bg-green-800 text-green-300 px-2 py-1 rounded">Payée</button>
                      )}
                      {a.statut === 'non_payée' && (
                        <button onClick={() => statusMutation.mutate({ id: a.id, statut: 'contestée' })} className="text-xs bg-yellow-900 hover:bg-yellow-800 text-yellow-300 px-2 py-1 rounded">Contestée</button>
                      )}
                      {a.statut !== 'annulée' && (
                        <button onClick={() => { if(confirm('Annuler cette amende ?')) statusMutation.mutate({ id: a.id, statut: 'annulée' }) }} className="text-xs bg-red-900 hover:bg-red-800 text-red-300 px-2 py-1 rounded">Annuler</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nouvelle amende" size="lg">
        <form onSubmit={e => { e.preventDefault(); createMutation.mutate({ ...form, montant: parseInt(form.montant) }) }} className="space-y-4">
          {/* Civil search */}
          <div>
            <label className="label">Rechercher le civil *</label>
            <input className="input" placeholder="Nom, prénom ou Roblox..." value={civilSearch} onChange={e => setCivilSearch(e.target.value)} />
            {civils && civils.length > 0 && !form.civilian_id && (
              <div className="mt-2 bg-gend-darker border border-gend-border rounded-lg overflow-hidden">
                {civils.map((c: any) => (
                  <button key={c.id} type="button" className="w-full text-left px-3 py-2 hover:bg-gend-border text-sm text-white border-b border-gend-border/50 last:border-0" onClick={() => { set('civilian_id', String(c.id)); setCivilSearch(`${c.prenom} ${c.nom}`) }}>
                    {c.prenom} {c.nom} {c.roblox_username ? `(${c.roblox_username})` : ''}
                  </button>
                ))}
              </div>
            )}
            {form.civilian_id && <div className="mt-1 text-green-400 text-xs">✓ Civil sélectionné — <button type="button" className="underline" onClick={() => { set('civilian_id', ''); setCivilSearch('') }}>changer</button></div>}
          </div>
          <div>
            <label className="label">Motif *</label>
            <select className="input" value={form.motif} onChange={e => set('motif', e.target.value)} required>
              <option value="">Sélectionner un motif</option>
              {MOTIFS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Montant (€) *</label><input className="input" type="number" min="1" value={form.montant} onChange={e => set('montant', e.target.value)} required /></div>
            <div><label className="label">Localisation</label><input className="input" value={form.localisation} onChange={e => set('localisation', e.target.value)} /></div>
          </div>
          <div><label className="label">Détails / circonstances</label><textarea className="input" rows={3} value={form.details} onChange={e => set('details', e.target.value)} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={createMutation.isPending || !form.civilian_id || !form.motif || !form.montant} className="btn-primary">Créer l'amende</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
