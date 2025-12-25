'use client'

import React, { useEffect, useState } from 'react'
import { User, Mail, Shield, Calendar, CheckCircle, Clock, Github, Loader2, AlertTriangle, RefreshCcw } from 'lucide-react'

interface UserData {
  id: number
  full_name: string
  email: string
  roles: string[]
  is_active: boolean
  created_at: string
  provider?: string
}

export default function Profile() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUserData = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Non connecté')
      }

      const res = await fetch('http://localhost:8080/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!res.ok) {
        if (res.status === 401) throw new Error('Session expirée')
        throw new Error('Erreur de chargement du profil')
      }

      const data = await res.json()
      setUserData({
        id: data.id || 0,
        full_name: data.full_name || data.name || 'Utilisateur',
        email: data.email || '',
        roles: data.roles || ['user'],
        is_active: data.is_active !== false,
        created_at: data.created_at || new Date().toISOString(),
        provider: data.provider
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return 'Date inconnue'
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center p-20">
        <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
        <p className="text-slate-400">Chargement du profil...</p>
      </div>
    )
  }

  if (error || !userData) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center p-20 text-center">
        <AlertTriangle size={48} className="text-red-500 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Erreur</h3>
        <p className="text-slate-400 mb-6">{error || 'Impossible de charger le profil'}</p>
        <button onClick={fetchUserData} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
          <RefreshCcw size={18} /> Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Profil Utilisateur</h2>

      {/* Profile Header Card */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 mb-8 flex flex-col md:flex-row items-center md:items-start gap-8">
        {/* Avatar */}
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-blue-900/20">
            <span className="text-4xl font-bold">{userData.full_name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="absolute bottom-0 right-0 bg-slate-900 p-1 rounded-full">
            <div className={`w-6 h-6 rounded-full border-4 border-slate-900 ${userData.is_active ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
            <h3 className="text-3xl font-bold text-white">{userData.full_name}</h3>
            <div className="flex gap-2 justify-center md:justify-start flex-wrap">
              {userData.provider && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-700 text-slate-300 border border-slate-600 uppercase tracking-wide flex items-center gap-1">
                  {userData.provider === 'github' && <Github size={12} />}
                  {userData.provider}
                </span>
              )}
              {userData.roles.map((role) => (
                <span key={role} className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wide">
                  {role}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 text-slate-400 mb-6">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Mail size={16} />
              <span>{userData.email}</span>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Calendar size={16} />
              <span>Membre depuis le {formatDate(userData.created_at)}</span>
            </div>
          </div>

          <div className="flex gap-4 justify-center md:justify-start">
            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors border border-slate-700">
              Modifier le profil
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('token')
                localStorage.removeItem('oauth_provider')
                window.location.href = '/'
              }}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-medium transition-colors border border-red-500/30"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Status */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="text-blue-500" size={20} />
            État du compte
          </h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
              <span className="text-slate-400">Statut</span>
              <span className={`flex items-center gap-2 font-medium ${userData.is_active ? 'text-emerald-500' : 'text-slate-500'}`}>
                <CheckCircle size={16} />
                {userData.is_active ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
              <span className="text-slate-400">ID Utilisateur</span>
              <span className="text-white font-mono">#{userData.id.toString().padStart(6, '0')}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
              <span className="text-slate-400">Méthode de connexion</span>
              <span className="text-white flex items-center gap-2">
                {userData.provider === 'github' && <Github size={16} className="text-slate-400" />}
                {userData.provider ? userData.provider.charAt(0).toUpperCase() + userData.provider.slice(1) : 'Email/Mot de passe'}
              </span>
            </div>
          </div>
        </div>

        {/* Preferences (Static for now) */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="text-purple-500" size={20} />
            Préférences
          </h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Notifications par email</span>
              <div className="w-11 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Authentification à deux facteurs</span>
              <div className="w-11 h-6 bg-slate-700 rounded-full relative cursor-pointer">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Thème sombre</span>
              <div className="w-11 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
