'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

import {
  LayoutDashboard,
  Scan,
  FileText,
  Settings,
} from 'lucide-react'

interface UserData {
  id: number
  full_name: string
  email: string
  roles: string[]
  is_active: boolean
  created_at: string
  provider?: string
}

const SidebarItem = ({ icon: Icon, label, href, active }: { icon: any, label: string, href: string, active: boolean }) => (
  <Link href={href}>
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${active
        ? 'bg-blue-500/10 text-blue-500'
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
        }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </div>
  </Link>
)



export default function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: { isMobileMenuOpen: boolean, setIsMobileMenuOpen: (open: boolean) => void }) {

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
  const pathname = usePathname()

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-screen w-64 bg-slate-950 border-r border-slate-800 transition-transform duration-300 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-2 px-6 h-16 border-b border-slate-800">
          <div className="w-8 h-8 relative flex items-center justify-center">
            <Image
              src="/images/logo/log_remove_back.png"
              alt="SecFlowCheck Logo"
              fill
              className="object-contain"
            />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">SecFlowCheck</span>
        </div>

        <nav className="p-4 space-y-2 mt-4">
          <SidebarItem
            icon={LayoutDashboard}
            label="Tableau de bord"
            href="/dashboard"
            active={pathname === '/dashboard'}
          />
          <SidebarItem
            icon={Scan}
            label="Analyses"
            href="/dashboard/scans"
            active={pathname.startsWith('/dashboard/scans')}
          />
          <SidebarItem
            icon={FileText}
            label="Rapports"
            href="/dashboard/reports"
            active={pathname.startsWith('/dashboard/reports')}
          />
          <SidebarItem
            icon={Settings}
            label="Paramètres"
            href="/dashboard/settings"
            active={pathname.startsWith('/dashboard/settings')}
          />
        </nav>

        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500" />
            <div>
              <p className="text-sm font-medium text-white">youssef</p>
              <p className="text-xs text-slate-500">{userData?.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
