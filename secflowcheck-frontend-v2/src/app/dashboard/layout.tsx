'use client'

import React, { useState } from 'react'
import Sidebar from '@/app/components/Dashboard/Sidebar'
import DashboardHeader from '@/app/components/Dashboard/DashboardHeader'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      
      <main className="lg:ml-64 min-h-screen transition-all duration-300">
        <DashboardHeader setIsMobileMenuOpen={setIsMobileMenuOpen} />
        <div className="p-4 sm:p-8 space-y-8">
          {children}
        </div>
      </main>
    </div>
  )
}
