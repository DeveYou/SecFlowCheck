'use client'

import React from 'react'
import { User, Mail, Shield, Calendar, CheckCircle, Clock } from 'lucide-react'

// Mock user data based on the backend model
// secflowcheck-authentication/app/models/user.py
const userData = {
  id: 1,
  full_name: 'Admin User',
  email: 'admin@secflow.io',
  roles: ['admin', 'user'],
  is_active: true,
  created_at: '2023-11-15T10:30:00Z',
  last_login: '2023-12-10T09:45:00Z' // Extra field for UI
}

export default function Profile() {
  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Profil Utilisateur</h2>

      {/* Profile Header Card */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 mb-8 flex flex-col md:flex-row items-center md:items-start gap-8">
        {/* Avatar */}
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-blue-900/20">
            <span className="text-4xl font-bold">{userData.full_name.charAt(0)}</span>
          </div>
          <div className="absolute bottom-0 right-0 bg-slate-900 p-1 rounded-full">
            <div className="bg-emerald-500 w-6 h-6 rounded-full border-4 border-slate-900"></div>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
            <h3 className="text-3xl font-bold text-white">{userData.full_name}</h3>
            <div className="flex gap-2 justify-center md:justify-start">
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
            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors border border-slate-700">
              Changer le mot de passe
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
              <span className="flex items-center gap-2 text-emerald-500 font-medium">
                <CheckCircle size={16} />
                Actif
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
              <span className="text-slate-400">ID Utilisateur</span>
              <span className="text-white font-mono">#{userData.id.toString().padStart(6, '0')}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
              <span className="text-slate-400">Dernière connexion</span>
              <span className="text-white flex items-center gap-2">
                <Clock size={14} className="text-slate-500" />
                {new Date(userData.last_login).toLocaleString('fr-FR')}
              </span>
            </div>
          </div>
        </div>

        {/* Preferences (Mock) */}
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
