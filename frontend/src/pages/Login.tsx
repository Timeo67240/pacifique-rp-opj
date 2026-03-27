import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { login, token } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (token) { navigate('/'); return null }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gend-darker flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gend-blue rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/50">
            <span className="text-4xl">⚜️</span>
          </div>
          <h1 className="text-3xl font-bold text-white">GENDARMERIE</h1>
          <div className="text-gend-gold font-semibold tracking-widest text-sm mt-1">PACIFIQUE RP</div>
          <div className="text-gray-400 text-sm mt-2">Système de Gestion OPJ</div>
        </div>

        <div className="card">
          <h2 className="text-white font-bold text-xl mb-6 text-center">Connexion</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Identifiant</label>
              <input className="input" type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Votre identifiant" autoFocus required />
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">{error}</div>}
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-sm mt-4">
          Pas encore de compte ? <Link to="/register" className="text-blue-400 hover:underline">Faire une demande d'accès</Link>
        </p>

        <p className="text-center text-gray-600 text-xs mt-3">
          Accès réservé au personnel de la Gendarmerie de Pacifique RP
        </p>
      </div>
    </div>
  )
}
