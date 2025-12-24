'use client'

import React from 'react'
import { Search, Menu, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DashboardHeader({ setIsMobileMenuOpen }: { setIsMobileMenuOpen: (open: boolean) => void }) {
  const router = useRouter()

  const handleLogout = () => {
    // TODO: Clear auth tokens/session here
    router.push('/')
  }

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden p-2 text-slate-400 hover:text-white"
        >
          <Menu size={24} />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Rechercher des projets..." 
            className="bg-slate-900 border border-slate-800 text-sm rounded-full pl-10 pr-4 py-1.5 focus:outline-none focus:border-blue-500 w-64 transition-colors"
          />
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-red-400 transition-colors"
          title="Se déconnecter"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  )
}
