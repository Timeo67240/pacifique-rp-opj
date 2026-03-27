import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import client from '../api/client'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAuth } from '../contexts/AuthContext'

const TYPES_PV = [
  { value: 'constatation', label: 'Constatation' },
  { value: 'audition', label: 'Audition' },
  { value: 'arrestation', label: 'Arrestation' },
  { value: 'contravention', label: 'Contravention' },
  { value: 'flagrant_delit', label: 'Flagrant délit' },
]

const STATUT_BADGE: Record<string, string> = {
  brouillon: 'badge-yellow', finalisé: 'badge-green', classé: 'badge-gray'
}

function fmt(d: string) { try { return format(new Date(d), 'dd/MM/yyyy HH:mm', { locale: fr }) } catch { return d } }

export default function PvPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [filterStatut, setFilterStatut] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterMine, setFilterMine] = useState(false)
  const [civilSearch, setCivilSearch] = useState('')
  const [form, setForm] = useState({ civilian_id: '', type_pv: 'constatation', titre: '', faits: '', articles_violes: '', sanctions: '', localisation: '', temoins: '' })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { data: pvs, isLoading } = useQuery({
    queryKey: ['pvs', filterStatut, filterType, filterMine],
    queryFn: () => client.get('/pv', {
      params: { statut: filterStatut || undefined, type_pv: filterType || undefined, officer_id: filterMine ? user?.id : undefined }
    }).then(r => r.data),
  })

  const { data: civils } = useQuery({
    queryKey: ['civils-search-pv', civilSearch],
    queryFn: () => client.get('/civilians', { params: { q: civilSearch } }).then(r => r.data),
    enabled: civilSearch.length > 1,
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => client.post('/pv', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pvs'] }); setShowCreate(false) },
  })

  return (
    <div className="p-6">
      <PageHeader
        title="Procès-Verbaux"
        subtitle={`${pvs?.length ?? 0} PV enregistré(s)`}
        actions={<button onClick={() => setShowCreate(true)} className="btn-primary">+ Rédiger un PV</button>}
      />

      {/* Filters */}
      <div className="card mb-6 flex gap-3 flex-wrap items-center">
        <select className="input w-44" value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
          <option value="">Tous statuts</option>
          <option value="brouillon">Brouillon</option>
          <option value="finalisé">Finalisé</option>
          <option value="classé">Classé</option>
        </select>
        <select className="input w-44" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Tous types</option>
          {TYPES_PV.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
          <input type="checkbox" checked={filterMine} onChange={e => setFilterMine(e.target.checked)} className="accent-blue-500" />
          Mes PV uniquement
        </label>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        {isLoading ? <div className="text-gray-400 text-center py-8">Chargement...</div> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gend-border text-gray-400 text-xs uppercase tracking-wider text-left">
                <th className="pb-3 pr-4">Numéro</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Titre</th>
                <th className="pb-3 pr-4">Civil</th>
                <th className="pb-3 pr-4">Officier</th>
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {pvs?.length === 0 && <tr><td colSpan={7} className="text-center text-gray-500 py-8">Aucun PV</td></tr>}
              {pvs?.map((p: any) => (
                <tr key={p.id} className="border-b border-gend-border/50 hover:bg-gend-border/30 transition-colors">
                  <td className="py-3 pr-4">
                    <Link to={`/pv/${p.id}`} className="text-gend-gold font-mono text-xs hover:text-yellow-300">{p.numero}</Link>
                  </td>
                  <td className="py-3 pr-4 text-gray-300 text-xs">{TYPES_PV.find(t => t.value === p.type_pv)?.label || p.type_pv}</td>
                  <td className="py-3 pr-4">
                    <Link to={`/pv/${p.id}`} className="text-white font-medium hover:text-blue-400 max-w-xs truncate block">{p.titre}</Link>
                  </td>
                  <td className="py-3 pr-4 text-gray-300">{p.prenom} {p.nom}</td>
                  <td className="py-3 pr-4 text-gray-300">
                    <div>{p.officer_name}</div>
                    {p.grade && <div className="text-gray-500 text-xs">{p.grade}</div>}
                  </td>
                  <td className="py-3 pr-4 text-gray-400 text-xs">{fmt(p.date)}</td>
                  <td className="py-3"><span className={STATUT_BADGE[p.statut] || 'badge-gray'}>{p.statut}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Rédiger un Procès-Verbal" size="xl">
        <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form) }} className="space-y-4">
          {/* Civil */}
          <div>
            <label className="label">Civil concerné *</label>
            <input className="input" placeholder="Rechercher par nom, prénom..." value={civilSearch} onChange={e => setCivilSearch(e.target.value)} />
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
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Type de PV *</label>
              <select className="input" value={form.type_pv} onChange={e => set('type_pv', e.target.value)}>
                {TYPES_PV.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div><label className="label">Localisation</label><input className="input" value={form.localisation} onChange={e => set('localisation', e.target.value)} /></div>
          </div>
          <div><label className="label">Titre du PV *</label><input className="input" value={form.titre} onChange={e => set('titre', e.target.value)} required placeholder="Ex: PV de constatation - Excès de vitesse..." /></div>
          <div><label className="label">Faits constatés *</label><textarea className="input" rows={6} value={form.faits} onChange={e => set('faits', e.target.value)} required placeholder="Description détaillée des faits constatés, circonstances, déroulement des événements..." /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Articles de loi violés</label><textarea className="input" rows={3} value={form.articles_violes} onChange={e => set('articles_violes', e.target.value)} placeholder="Art. L235-1 Code de la Route..." /></div>
            <div><label className="label">Sanctions / Mesures</label><textarea className="input" rows={3} value={form.sanctions} onChange={e => set('sanctions', e.target.value)} placeholder="Amendes, GAV, saisie de véhicule..." /></div>
          </div>
          <div><label className="label">Témoins</label><input className="input" value={form.temoins} onChange={e => set('temoins', e.target.value)} placeholder="Noms des témoins présents..." /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={createMutation.isPending || !form.civilian_id || !form.titre || !form.faits} className="btn-primary">Créer le PV</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
