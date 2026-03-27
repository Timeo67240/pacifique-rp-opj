import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import client from '../api/client'

const GRADES = [
  'Gendarme', 'Gendarme de 1ère Classe', 'Brigadier', 'Brigadier-Chef',
  'Maréchal des Logis', 'Maréchal des Logis-Chef', 'Adjudant', 'Adjudant-Chef', 'Major',
  'Lieutenant', 'Capitaine', 'Commandant', 'Lieutenant-Colonel', 'Colonel',
  'Général de Brigade', 'Général de Division', 'Général de Corps d\'Armée',
  'Général d\'Armée', 'Général d\'Armée (5 étoiles)'
]

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '', confirm: '', grade: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Les mots de passe ne correspondent pas'); return }
    if (form.password.length < 6) { setError('Mot de passe trop court (min. 6 caractères)'); return }
    setLoading(true)
    try {
      await client.post('/auth/register', { username: form.username, password: form.password, grade: form.grade })
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la demande')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gend-darker flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-white mb-2">Demande envoyée !</h2>
          <p className="text-gray-400 mb-6">Votre demande de compte a bien été reçue. Un administrateur va l'examiner et valider votre accès.</p>
          <Link to="/login" className="btn-primary inline-block">Retour à la connexion</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gend-darker flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gend-blue rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/50">
            <span className="text-4xl">⚜️</span>
          </div>
          <h1 className="text-3xl font-bold text-white">GENDARMERIE</h1>
          <div className="text-gend-gold font-semibold tracking-widest text-sm mt-1">PACIFIQUE RP</div>
          <div className="text-gray-400 text-sm mt-2">Demande d'accès au système OPJ</div>
        </div>

        <div className="card">
          <h2 className="text-white font-bold text-xl mb-6 text-center">Créer un compte</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Identifiant *</label>
              <input className="input" value={form.username} onChange={e => set('username', e.target.value)} placeholder="Votre pseudo Roblox" required />
            </div>
            <div>
              <label className="label">Grade</label>
              <select className="input" value={form.grade} onChange={e => set('grade', e.target.value)}>
                <option value="">— Sélectionner votre grade —</option>
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Mot de passe *</label>
              <input className="input" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 6 caractères" required />
            </div>
            <div>
              <label className="label">Confirmer le mot de passe *</label>
              <input className="input" type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)} placeholder="••••••••" required />
            </div>
            {error && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">{error}</div>}
            <div className="bg-blue-900/30 border border-blue-700/50 text-blue-300 rounded-lg px-4 py-3 text-xs">
              Votre demande sera examinée par un administrateur avant activation.
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Envoi...' : 'Envoyer la demande'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-sm mt-4">
          Déjà un compte ? <Link to="/login" className="text-blue-400 hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
