'use client'

import React, { useEffect, useState } from 'react'
import { FileText, Download, Trash2, Search, Filter } from 'lucide-react'

interface Report {
  id: number
  fileName: string
  date: string
  score: number
  status: string
  issuesCount: number
  result: any
}

export default function ReportsList() {
  const [reports, setReports] = useState<Report[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const storedReports = JSON.parse(localStorage.getItem('secflow_reports') || '[]')
    setReports(storedReports)
  }, [])

  const deleteReport = (id: number) => {
    const updatedReports = reports.filter(r => r.id !== id)
    setReports(updatedReports)
    localStorage.setItem('secflow_reports', JSON.stringify(updatedReports))
  }

  const downloadReport = (report: Report) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Rapport de Sécurité - ${report.fileName}</title>
        <style>
          body { font-family: system-ui, sans-serif; line-height: 1.5; max-width: 800px; margin: 0 auto; padding: 2rem; color: #1e293b; }
          h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 1rem; }
          .score-card { background: #f8fafc; padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 2rem; border: 1px solid #e2e8f0; }
          .score { font-size: 2.5rem; font-weight: bold; color: ${report.score > 80 ? '#10b981' : report.score > 50 ? '#eab308' : '#ef4444'}; }
          .issue { padding: 1rem; border: 1px solid #e2e8f0; margin-bottom: 1rem; border-radius: 0.5rem; }
          .high { border-left: 4px solid #ef4444; }
          .medium { border-left: 4px solid #f97316; }
          .low { border-left: 4px solid #eab308; }
          .badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
          .badge-high { background: #fef2f2; color: #ef4444; }
          .badge-medium { background: #fff7ed; color: #f97316; }
          .badge-low { background: #fefce8; color: #eab308; }
        </style>
      </head>
      <body>
        <h1>Rapport d'Analyse de Sécurité</h1>
        <div class="score-card">
          <p>Fichier: <strong>${report.fileName}</strong></p>
          <p>Date: ${new Date(report.date).toLocaleDateString('fr-FR')}</p>
          <p>Score de Sécurité</p>
          <div class="score">${report.score}/100</div>
        </div>
        <h2>Vulnérabilités Détectées (${report.issuesCount})</h2>
        ${report.result.issues.map((issue: any) => `
          <div class="issue ${issue.severity.toLowerCase()}">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span class="badge badge-${issue.severity.toLowerCase()}">${issue.severity}</span>
              <span style="color: #64748b; font-size: 0.875rem;">Ligne ${issue.line}</span>
            </div>
            <div style="font-weight: 500;">${issue.message}</div>
          </div>
        `).join('')}
      </body>
      </html>
    `

    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rapport-securite-${report.fileName}-${report.id}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const filteredReports = reports.filter(report => 
    report.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Rapports de Sécurité</h2>
          <p className="text-slate-400">Historique de toutes les analyses générées</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Rechercher un rapport..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-sm rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500 text-white"
            />
          </div>
          <button className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/30 border border-slate-800 rounded-xl border-dashed">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 mx-auto mb-4">
            <FileText size={32} />
          </div>
          <h3 className="text-lg font-medium text-white mb-1">Aucun rapport trouvé</h3>
          <p className="text-slate-500">Lancez une analyse pour générer votre premier rapport.</p>
        </div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 text-slate-400 text-sm uppercase tracking-wider border-b border-slate-800">
                  <th className="px-6 py-4 font-medium">Fichier</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Score</th>
                  <th className="px-6 py-4 font-medium">Problèmes</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                          <FileText size={18} />
                        </div>
                        <span className="font-medium text-white">{report.fileName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {new Date(report.date).toLocaleDateString('fr-FR', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          report.score > 80 ? 'bg-emerald-500' : report.score > 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className={`font-medium ${
                          report.score > 80 ? 'text-emerald-500' : report.score > 50 ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                          {report.score}/100
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {report.issuesCount} détectés
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => downloadReport(report)}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Télécharger"
                        >
                          <Download size={18} />
                        </button>
                        <button 
                          onClick={() => deleteReport(report.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
