import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import Modal from '../components/Modal'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const STATUT_BADGE: Record<string, string> = {
  actif: 'badge-green', recherché: 'badge-red', interdit_séjour: 'badge-yellow', archivé: 'badge-gray',
  payée: 'badge-green', non_payée: 'badge-red', contestée: 'badge-yellow', annulée: 'badge-gray',
  en_cours: 'badge-red', terminée: 'badge-green', levée: 'badge-blue', prolongée: 'badge-yellow',
  brouillon: 'badge-yellow', finalisé: 'badge-green', classé: 'badge-gray',
}

function fmt(d: string) { try { return format(new Date(d), 'dd/MM/yyyy HH:mm', { locale: fr }) } catch { return d } }

export default function CivilDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)

  const { data: civil, isLoading } = useQuery({
    queryKey: ['civil', id],
    queryFn: () => client.get(`/civilians/${id}`).then(r => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => client.put(`/civilians/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['civil', id] }); setEditOpen(false) },
  })

  const archiveMutation = useMutation({
    mutationFn: () => client.delete(`/civilians/${id}`),
    onSuccess: () => navigate('/civils'),
  })

  if (isLoading) return <div className="p-6 text-gray-400">Chargement...</div>
  if (!civil) return <div className="p-6 text-red-400">Civil non trouvé</div>

  const openEdit = () => { setEditData({ ...civil }); setEditOpen(true) }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Nav */}
      <button onClick={() => navigate('/civils')} className="text-gray-400 hover:text-white text-sm mb-4 flex items-center gap-1">← Retour aux civils</button>

      {/* Header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{civil.prenom} {civil.nom}</h1>
              <span className={STATUT_BADGE[civil.statut] || 'badge-gray'}>{civil.statut}</span>
            </div>
            {civil.roblox_username && <div className="text-gend-gold text-sm">🎮 {civil.roblox_username}</div>}
            <div className="text-gray-400 text-sm mt-1">Enregistré le {fmt(civil.created_at)}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={openEdit} className="btn-secondary">Modifier</button>
            <button onClick={() => { if (confirm('Archiver ce civil ?')) archiveMutation.mutate() }} className="btn-danger">Archiver</button>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gend-border">
          {[
            ['Date de naissance', civil.date_naissance ? format(new Date(civil.date_naissance), 'dd/MM/yyyy') : '—'],
            ['Nationalité', civil.nationalite || '—'],
            ['Adresse', civil.adresse || '—'],
            ['Téléphone', civil.telephone || '—'],
            ['Profession', civil.profession || '—'],
          ].map(([l, v]) => (
            <div key={l}><div className="label">{l}</div><div className="text-white text-sm">{v}</div></div>
          ))}
        </div>

        {civil.antecedents && (
          <div className="mt-4 pt-4 border-t border-gend-border">
            <div className="label">Antécédents judiciaires</div>
            <p className="text-red-300 text-sm whitespace-pre-wrap">{civil.antecedents}</p>
          </div>
        )}
        {civil.notes && (
          <div className="mt-4 pt-4 border-t border-gend-border">
            <div className="label">Notes</div>
            <p className="text-gray-300 text-sm whitespace-pre-wrap">{civil.notes}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Amendes */}
        <div className="card">
          <h3 className="text-white font-bold mb-3">💶 Amendes ({civil.fines?.length || 0})</h3>
          {civil.fines?.length === 0 && <p className="text-gray-500 text-sm">Aucune amende</p>}
          <div className="space-y-2">
            {civil.fines?.map((f: any) => (
              <div key={f.id} className="bg-gend-darker rounded-lg p-3">
                <div className="flex justify-between">
                  <span className="text-yellow-400 font-bold">{f.montant}€</span>
                  <span className={STATUT_BADGE[f.statut] || 'badge-gray'}>{f.statut}</span>
                </div>
                <div className="text-sm text-white mt-1">{f.motif}</div>
                <div className="text-xs text-gray-400 mt-1">{fmt(f.date)} — {f.officer_name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* GAV */}
        <div className="card">
          <h3 className="text-white font-bold mb-3">🔒 Gardes à vue ({civil.custodies?.length || 0})</h3>
          {civil.custodies?.length === 0 && <p className="text-gray-500 text-sm">Aucune GAV</p>}
          <div className="space-y-2">
            {civil.custodies?.map((g: any) => (
              <div key={g.id} className="bg-gend-darker rounded-lg p-3">
                <div className="flex justify-between">
                  <span className="text-white text-sm font-medium">{g.motif}</span>
                  <span className={STATUT_BADGE[g.statut] || 'badge-gray'}>{g.statut}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">Début: {fmt(g.date_debut)}</div>
                {g.date_fin && <div className="text-xs text-gray-400">Fin: {fmt(g.date_fin)}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* PV */}
        <div className="card">
          <h3 className="text-white font-bold mb-3">📋 PV ({civil.pvs?.length || 0})</h3>
          {civil.pvs?.length === 0 && <p className="text-gray-500 text-sm">Aucun PV</p>}
          <div className="space-y-2">
            {civil.pvs?.map((p: any) => (
              <div key={p.id} className="bg-gend-darker rounded-lg p-3">
                <div className="flex justify-between">
                  <span className="text-gend-gold text-xs font-mono">{p.numero}</span>
                  <span className={STATUT_BADGE[p.statut] || 'badge-gray'}>{p.statut}</span>
                </div>
                <div className="text-sm text-white mt-1">{p.titre}</div>
                <div className="text-xs text-gray-400 mt-1">{fmt(p.date)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Modifier le civil" size="lg">
        {editData && (
          <form onSubmit={e => { e.preventDefault(); updateMutation.mutate(editData) }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {([['nom','Nom'],['prenom','Prénom'],['nationalite','Nationalité'],['roblox_username','Roblox'],['telephone','Téléphone'],['profession','Profession']] as [string,string][]).map(([k,l]) => (
                <div key={k}><label className="label">{l}</label><input className="input" value={editData[k] || ''} onChange={e => setEditData((d: any) => ({...d, [k]: e.target.value}))} /></div>
              ))}
              <div><label className="label">Date naissance</label><input className="input" type="date" value={editData.date_naissance || ''} onChange={e => setEditData((d: any) => ({...d, date_naissance: e.target.value}))} /></div>
              <div><label className="label">Statut</label>
                <select className="input" value={editData.statut} onChange={e => setEditData((d: any) => ({...d, statut: e.target.value}))}>
                  {['actif','recherché','interdit_séjour','archivé'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2"><label className="label">Adresse</label><input className="input" value={editData.adresse || ''} onChange={e => setEditData((d: any) => ({...d, adresse: e.target.value}))} /></div>
              <div className="col-span-2"><label className="label">Antécédents</label><textarea className="input" rows={3} value={editData.antecedents || ''} onChange={e => setEditData((d: any) => ({...d, antecedents: e.target.value}))} /></div>
              <div className="col-span-2"><label className="label">Notes</label><textarea className="input" rows={2} value={editData.notes || ''} onChange={e => setEditData((d: any) => ({...d, notes: e.target.value}))} /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="submit" disabled={updateMutation.isPending} className="btn-primary">Enregistrer</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
