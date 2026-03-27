import React, { useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const TYPES_PV: Record<string, string> = {
  constatation: 'DE CONSTATATION', audition: 'D\'AUDITION', arrestation: 'D\'ARRESTATION',
  contravention: 'DE CONTRAVENTION', flagrant_delit: 'DE FLAGRANT DÉLIT'
}

function fmt(d: string | null) { if (!d) return '—'; try { return format(new Date(d), 'dd MMMM yyyy à HH:mm', { locale: fr }) } catch { return d } }
function fmtDate(d: string | null) { if (!d) return '—'; try { return format(new Date(d), 'dd/MM/yyyy', { locale: fr }) } catch { return d } }

export default function PvDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const pvRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState<any>(null)

  const { data: pv, isLoading } = useQuery({
    queryKey: ['pv', id],
    queryFn: () => client.get(`/pv/${id}`).then(r => r.data),
  })

  const statusMutation = useMutation({
    mutationFn: (statut: string) => client.patch(`/pv/${id}/statut`, { statut }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pv', id] }),
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => client.put(`/pv/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pv', id] }); setEditing(false) },
  })

  const exportPDF = async () => {
    if (!pvRef.current) return
    setExporting(true)
    try {
      const canvas = await html2canvas(pvRef.current, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth - 20
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let y = 10
      let remainingHeight = imgHeight
      while (remainingHeight > 0) {
        if (y > 10) pdf.addPage()
        const sliceHeight = Math.min(pageHeight - 20, remainingHeight)
        pdf.addImage(imgData, 'PNG', 10, y === 10 ? 10 : 10, imgWidth, imgHeight, '', 'FAST')
        remainingHeight -= sliceHeight
        y = 10
        if (remainingHeight > 0) break
      }
      pdf.save(`${pv.numero}.pdf`)
    } finally {
      setExporting(false)
    }
  }

  if (isLoading) return <div className="p-6 text-gray-400">Chargement...</div>
  if (!pv) return <div className="p-6 text-red-400">PV non trouvé</div>

  const openEdit = () => { setEditData({ ...pv }); setEditing(true) }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate('/pv')} className="text-gray-400 hover:text-white text-sm mb-4 flex items-center gap-1">← Retour aux PV</button>

      {/* Actions bar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <span className={`text-xs px-2 py-1 rounded font-medium ${pv.statut === 'finalisé' ? 'bg-green-900 text-green-300' : pv.statut === 'classé' ? 'bg-gray-800 text-gray-300' : 'bg-yellow-900 text-yellow-300'}`}>{pv.statut}</span>
        <div className="flex-1" />
        <button onClick={openEdit} className="btn-secondary text-sm">Modifier</button>
        {pv.statut === 'brouillon' && <button onClick={() => statusMutation.mutate('finalisé')} className="btn-success text-sm">Finaliser</button>}
        {pv.statut === 'finalisé' && <button onClick={() => statusMutation.mutate('classé')} className="btn-secondary text-sm">Classer</button>}
        <button onClick={exportPDF} disabled={exporting} className="btn-primary text-sm">{exporting ? 'Export...' : '⬇ Export PDF'}</button>
      </div>

      {/* PV Document */}
      <div ref={pvRef} className="bg-white text-gray-900 rounded-xl shadow-2xl p-10 font-serif" style={{ fontFamily: 'Georgia, serif', lineHeight: '1.6' }}>
        {/* Header */}
        <div className="border-b-4 border-blue-900 pb-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-blue-900 font-bold text-lg uppercase tracking-widest">RÉPUBLIQUE FRANÇAISE</div>
              <div className="text-blue-900 text-sm uppercase tracking-wider mt-1">Gendarmerie Nationale</div>
              <div className="text-gray-600 text-sm">Brigade de Gendarmerie — Pacifique RP</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase tracking-wider">Numéro de procédure</div>
              <div className="text-blue-900 font-bold font-mono text-xl">{pv.numero}</div>
              <div className="text-gray-500 text-xs mt-1">Le {fmt(pv.date)}</div>
            </div>
          </div>

          <div className="text-center mt-6">
            <div className="text-2xl font-bold text-blue-900 uppercase tracking-wider border-2 border-blue-900 inline-block px-8 py-2">
              PROCÈS-VERBAL {TYPES_PV[pv.type_pv] || pv.type_pv.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Officer */}
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded p-4">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Officier Rédacteur</div>
          <div className="grid grid-cols-3 gap-4">
            <div><span className="text-gray-500 text-xs">Grade :</span> <span className="font-semibold">{pv.grade || '—'}</span></div>
            <div><span className="text-gray-500 text-xs">Nom :</span> <span className="font-semibold">{pv.officer_name}</span></div>
            <div><span className="text-gray-500 text-xs">Matricule :</span> <span className="font-semibold font-mono">{pv.officer_matricule || '—'}</span></div>
          </div>
        </div>

        {/* Civil */}
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded p-4">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Personne Concernée</div>
          <div className="grid grid-cols-2 gap-4">
            <div><span className="text-gray-500 text-xs">Nom complet :</span> <span className="font-bold">{pv.prenom} {pv.nom}</span></div>
            <div><span className="text-gray-500 text-xs">Username Roblox :</span> <span className="font-semibold">{pv.roblox_username || '—'}</span></div>
            <div><span className="text-gray-500 text-xs">Date de naissance :</span> <span>{pv.date_naissance ? fmtDate(pv.date_naissance) : '—'}</span></div>
            <div><span className="text-gray-500 text-xs">Adresse :</span> <span>{pv.adresse || '—'}</span></div>
          </div>
        </div>

        {/* Faits */}
        <div className="mb-6">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 border-b border-gray-200 pb-1">Faits Constatés</div>
          {pv.localisation && <div className="mb-3 text-sm"><span className="text-gray-500">Lieu :</span> <span className="font-semibold">{pv.localisation}</span></div>}
          <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">{pv.faits}</div>
        </div>

        {/* Articles */}
        {pv.articles_violes && (
          <div className="mb-6">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">Articles de Loi Violés</div>
            <div className="text-gray-800 whitespace-pre-wrap">{pv.articles_violes}</div>
          </div>
        )}

        {/* Sanctions */}
        {pv.sanctions && (
          <div className="mb-6">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">Sanctions / Mesures Prises</div>
            <div className="text-gray-800 whitespace-pre-wrap">{pv.sanctions}</div>
          </div>
        )}

        {/* Témoins */}
        {pv.temoins && (
          <div className="mb-6">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">Témoins</div>
            <div className="text-gray-800">{pv.temoins}</div>
          </div>
        )}

        {/* Signature */}
        <div className="mt-12 pt-6 border-t-2 border-gray-200">
          <div className="grid grid-cols-2 gap-12">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-12">Signature de l'officier rédacteur</div>
              <div className="border-t border-gray-400 pt-2 text-sm font-semibold">{pv.grade} {pv.officer_name}</div>
              <div className="text-xs text-gray-500">{pv.officer_matricule}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-12">Signature / Cachet du Commandant</div>
              <div className="border-t border-gray-400 pt-2 text-sm text-gray-500">Brigade de Gendarmerie</div>
              <div className="text-xs text-gray-400">Pacifique RP</div>
            </div>
          </div>
          <div className="text-center mt-6 text-xs text-gray-400">
            Document officiel — Gendarmerie Nationale — Pacifique RP — {pv.numero}
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {editing && editData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setEditing(false)} />
          <div className="relative bg-gend-card border border-gend-border rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gend-border">
              <h2 className="text-white font-bold">Modifier le PV</h2>
              <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-white text-xl">×</button>
            </div>
            <form onSubmit={e => { e.preventDefault(); updateMutation.mutate(editData) }} className="overflow-y-auto p-4 space-y-4 flex-1">
              <div><label className="label">Titre</label><input className="input" value={editData.titre || ''} onChange={e => setEditData((d: any) => ({...d, titre: e.target.value}))} required /></div>
              <div><label className="label">Faits</label><textarea className="input" rows={8} value={editData.faits || ''} onChange={e => setEditData((d: any) => ({...d, faits: e.target.value}))} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Articles violés</label><textarea className="input" rows={3} value={editData.articles_violes || ''} onChange={e => setEditData((d: any) => ({...d, articles_violes: e.target.value}))} /></div>
                <div><label className="label">Sanctions</label><textarea className="input" rows={3} value={editData.sanctions || ''} onChange={e => setEditData((d: any) => ({...d, sanctions: e.target.value}))} /></div>
              </div>
              <div><label className="label">Témoins</label><input className="input" value={editData.temoins || ''} onChange={e => setEditData((d: any) => ({...d, temoins: e.target.value}))} /></div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Annuler</button>
                <button type="submit" disabled={updateMutation.isPending} className="btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
