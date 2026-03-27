import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import { format, formatDistanceStrict } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAuth } from '../contexts/AuthContext'

const MOTIFS_GAV = [
  'Suspicion de crime', 'Suspicion de délit', 'Trouble à l\'ordre public grave',
  'Flagrant délit', 'Possession de stupéfiants', 'Port d\'arme illégal',
  'Agression', 'Vol avec violence', 'Trafic de stupéfiants', 'Autre motif'
]

const STATUT_BADGE: Record<string, string> = {
  en_cours: 'badge-red', terminée: 'badge-green', levée: 'badge-blue', prolongée: 'badge-yellow'
}

function fmt(d: string) { try { return format(new Date(d), 'dd/MM/yyyy HH:mm', { locale: fr }) } catch { return d } }
function duration(start: string, end?: string) {
  try {
    const s = new Date(start), e = end ? new Date(end) : new Date()
    return formatDistanceStrict(s, e, { locale: fr })
  } catch { return '—' }
}

export default function GavPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [showClose, setShowClose] = useState<any>(null)
  const [filterStatut, setFilterStatut] = useState('')
  const [civilSearch, setCivilSearch] = useState('')
  const [form, setForm] = useState({ civilian_id: '', motif: '', details: '', lieu: 'Brigade de Gendarmerie - Pacifique RP' })
  const [closeForm, setCloseForm] = useState({ statut: 'terminée', notes: '' })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { data: gavs, isLoading } = useQuery({
    queryKey: ['gavs', filterStatut],
    queryFn: () => client.get('/custody', { params: { statut: filterStatut || undefined } }).then(r => r.data),
  })

  const { data: civils } = useQuery({
    queryKey: ['civils-search-gav', civilSearch],
    queryFn: () => client.get('/civilians', { params: { q: civilSearch } }).then(r => r.data),
    enabled: civilSearch.length > 1,
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => client.post('/custody', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gavs'] }); setShowCreate(false); setForm({ civilian_id: '', motif: '', details: '', lieu: 'Brigade de Gendarmerie - Pacifique RP' }) },
  })

  const closeMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => client.patch(`/custody/${id}/cloturer`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gavs'] }); setShowClose(null) },
  })

  const enCours = gavs?.filter((g: any) => g.statut === 'en_cours').length || 0

  return (
    <div className="p-6">
      <PageHeader
        title="Gardes à Vue"
        subtitle={`${enCours} en cours — ${gavs?.length ?? 0} au total`}
        actions={<button onClick={() => setShowCreate(true)} className="btn-primary">+ Ouvrir une GAV</button>}
      />

      {/* Filters */}
      <div className="card mb-6 flex gap-3">
        <select className="input w-48" value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="en_cours">En cours</option>
          <option value="terminée">Terminée</option>
          <option value="levée">Levée</option>
          <option value="prolongée">Prolongée</option>
        </select>
      </div>

      {/* Cards */}
      {isLoading ? <div className="text-gray-400 text-center py-8">Chargement...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {gavs?.length === 0 && <p className="text-gray-500 col-span-3 text-center py-8">Aucune garde à vue</p>}
          {gavs?.map((g: any) => (
            <div key={g.id} className={`card border ${g.statut === 'en_cours' ? 'border-red-700' : 'border-gend-border'}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-white font-bold">{g.prenom} {g.nom}</div>
                  {g.roblox_username && <div className="text-gend-gold text-xs">{g.roblox_username}</div>}
                </div>
                <span className={STATUT_BADGE[g.statut] || 'badge-gray'}>{g.statut.replace('_', ' ')}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-400">Motif:</span> <span className="text-white">{g.motif}</span></div>
                <div><span className="text-gray-400">Lieu:</span> <span className="text-gray-300">{g.lieu}</span></div>
                <div><span className="text-gray-400">Officier:</span> <span className="text-gray-300">{g.grade} {g.officer_name}</span></div>
                <div><span className="text-gray-400">Début:</span> <span className="text-gray-300">{fmt(g.date_debut)}</span></div>
                {g.date_fin && <div><span className="text-gray-400">Fin:</span> <span className="text-gray-300">{fmt(g.date_fin)}</span></div>}
                <div className={`font-mono text-xs ${g.statut === 'en_cours' ? 'text-red-400' : 'text-gray-400'}`}>
                  ⏱ Durée: {duration(g.date_debut, g.date_fin)}
                </div>
                {g.details && <div className="text-gray-400 text-xs border-t border-gend-border pt-2">{g.details}</div>}
                {g.notes && <div className="text-gray-300 text-xs bg-gend-darker rounded p-2 mt-1">{g.notes}</div>}
              </div>
              {g.statut === 'en_cours' && (
                <button onClick={() => { setShowClose(g); setCloseForm({ statut: 'terminée', notes: '' }) }} className="btn-secondary w-full mt-3 text-sm">
                  Clôturer la GAV
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Ouvrir une Garde à Vue" size="lg">
        <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form) }} className="space-y-4">
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
            <label className="label">Motif de GAV *</label>
            <select className="input" value={form.motif} onChange={e => set('motif', e.target.value)} required>
              <option value="">Sélectionner un motif</option>
              {MOTIFS_GAV.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div><label className="label">Lieu de rétention</label><input className="input" value={form.lieu} onChange={e => set('lieu', e.target.value)} /></div>
          <div><label className="label">Détails / circonstances</label><textarea className="input" rows={3} value={form.details} onChange={e => set('details', e.target.value)} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={createMutation.isPending || !form.civilian_id || !form.motif} className="btn-primary">Ouvrir la GAV</button>
          </div>
        </form>
      </Modal>

      {/* Close Modal */}
      <Modal open={!!showClose} onClose={() => setShowClose(null)} title={`Clôturer — GAV de ${showClose?.prenom} ${showClose?.nom}`}>
        <form onSubmit={e => { e.preventDefault(); closeMutation.mutate({ id: showClose.id, ...closeForm }) }} className="space-y-4">
          <div>
            <label className="label">Résultat de la GAV *</label>
            <select className="input" value={closeForm.statut} onChange={e => setCloseForm(f => ({ ...f, statut: e.target.value }))}>
              <option value="terminée">Terminée (remis en liberté)</option>
              <option value="levée">Levée (sans suite)</option>
              <option value="prolongée">Prolongée</option>
            </select>
          </div>
          <div><label className="label">Notes de clôture</label><textarea className="input" rows={4} value={closeForm.notes} onChange={e => setCloseForm(f => ({ ...f, notes: e.target.value }))} placeholder="Résumé, décisions prises, transfert..." /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowClose(null)} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={closeMutation.isPending} className="btn-danger">Clôturer la GAV</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
