'use client'

import React, { useEffect, useState } from 'react'
import { FileText, Download, Trash2, Search, Filter, Loader2, Eye, X, AlertTriangle, CheckCircle, Shield } from 'lucide-react'

interface Features {
  num_jobs: number
  num_steps: number
  has_secrets: boolean
  privileged_access: boolean
}

interface Report {
  id: string
  fileName: string
  date: string
  score: string
  grade: string
  issuesCount: number
  features: Features
  result: any
}

export default function ReportsList() {
  const [reports, setReports] = useState<Report[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)

  const fetchReports = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:8080/reports/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) {
        if (res.status === 401) throw new Error("Session expirée")
        throw new Error("Échec du chargement des rapports")
      }
      const data = await res.json()
      // Map backend response to frontend format
      const mappedReports = (data.results || []).map((r: any) => {
        // Get features from metadata or top-level
        const features = r.metadata?.features || r.features || {}
        return {
          id: r._id || r.id,
          fileName: r.pipeline_name || r.filename || 'Unknown',
          date: r.created_at || new Date().toISOString(),
          score: r.score || r.risk_score || 'UNKNOWN',
          grade: r.grade || 'N/A',
          issuesCount: r.findings?.length || r.total_findings || 0,
          features: {
            num_jobs: features.num_jobs ?? 0,
            num_steps: features.num_steps ?? 0,
            has_secrets: features.has_secrets ?? false,
            privileged_access: features.privileged_access ?? false
          },
          result: r
        }
      })
      setReports(mappedReports)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const deleteReport = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:8080/reports/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.ok) {
        setReports(reports.filter(r => r.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete report:', err)
    }
  }

  const downloadReport = (report: Report) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Rapport de Sécurité - ${report.fileName}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 900px; margin: 0 auto; padding: 2rem; color: #1e293b; background: #f8fafc; }
          h1 { color: #0f172a; border-bottom: 3px solid #3b82f6; padding-bottom: 1rem; margin-bottom: 2rem; }
          h2 { color: #334155; margin-top: 2rem; }
          .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 2rem; border-radius: 1rem; margin-bottom: 2rem; }
          .header h1 { border: none; color: white; margin: 0; }
          .header p { color: #94a3b8; margin: 0.5rem 0 0 0; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
          .card { background: white; padding: 1.5rem; border-radius: 0.75rem; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .card-title { font-size: 0.875rem; color: #64748b; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; }
          .card-value { font-size: 2rem; font-weight: 700; }
          .card-sub { font-size: 0.75rem; color: #94a3b8; margin-top: 0.25rem; }
          .score-low { color: #10b981; }
          .score-medium { color: #f59e0b; }
          .score-high { color: #ef4444; }
          .score-critical { color: #dc2626; }
          .status-ok { color: #10b981; }
          .status-warning { color: #ef4444; }
          .findings-section { background: white; border-radius: 1rem; border: 1px solid #e2e8f0; overflow: hidden; }
          .findings-header { background: #f8fafc; padding: 1rem 1.5rem; border-bottom: 1px solid #e2e8f0; font-weight: 600; }
          .finding { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; }
          .finding:last-child { border-bottom: none; }
          .finding-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
          .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
          .badge-critical { background: #fef2f2; color: #dc2626; }
          .badge-high { background: #fff7ed; color: #ea580c; }
          .badge-medium { background: #fefce8; color: #ca8a04; }
          .badge-low { background: #f0fdf4; color: #16a34a; }
          .rule-id { color: #64748b; font-size: 0.875rem; font-family: monospace; background: #f1f5f9; padding: 0.25rem 0.5rem; border-radius: 0.25rem; }
          .finding-desc { color: #334155; margin-bottom: 0.5rem; }
          .finding-location { color: #64748b; font-size: 0.875rem; }
          .empty-state { text-align: center; padding: 3rem; color: #64748b; }
          .check-icon { font-size: 3rem; margin-bottom: 1rem; }
          .footer { text-align: center; color: #94a3b8; font-size: 0.875rem; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🛡️ Rapport d'Analyse de Sécurité</h1>
          <p>Généré le ${new Date(report.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-title">Fichier Analysé</div>
            <div class="card-value" style="font-size: 1.25rem; word-break: break-all;">${report.fileName}</div>
          </div>
          <div class="card">
            <div class="card-title">Score de Risque</div>
            <div class="card-value ${report.score === 'LOW' ? 'score-low' : report.score === 'MEDIUM' ? 'score-medium' : report.score === 'HIGH' ? 'score-high' : 'score-critical'}">${report.grade}</div>
            <div class="card-sub">${report.score}</div>
          </div>
          <div class="card">
            <div class="card-title">Secrets Détectés</div>
            <div class="card-value ${report.features.has_secrets ? 'status-warning' : 'status-ok'}">${report.features.has_secrets ? '⚠️ OUI' : '✅ NON'}</div>
            <div class="card-sub">${report.features.has_secrets ? 'Attention requise' : 'Aucun secret'}</div>
          </div>
          <div class="card">
            <div class="card-title">Accès Privilégiés</div>
            <div class="card-value ${report.features.privileged_access ? 'status-warning' : 'status-ok'}">${report.features.privileged_access ? '⚠️ OUI' : '✅ NON'}</div>
            <div class="card-sub">${report.features.privileged_access ? 'Attention requise' : 'Aucun accès'}</div>
          </div>
        </div>

        <div class="grid" style="grid-template-columns: repeat(2, 1fr);">
          <div class="card">
            <div class="card-title">Jobs Détectés</div>
            <div class="card-value">${report.features.num_jobs}</div>
            <div class="card-sub">Dans le pipeline</div>
          </div>
          <div class="card">
            <div class="card-title">Steps Détectés</div>
            <div class="card-value">${report.features.num_steps}</div>
            <div class="card-sub">Dans le pipeline</div>
          </div>
        </div>

        <h2>🔍 Vulnérabilités Détectées (${report.issuesCount})</h2>
        <div class="findings-section">
          ${(report.result?.findings || []).length > 0 ? `
            <div class="findings-header">Liste des problèmes identifiés</div>
            ${(report.result.findings || []).map((finding: any) => `
              <div class="finding">
                <div class="finding-header">
                  <span class="badge badge-${(finding.severity || 'low').toLowerCase()}">${finding.severity || 'INFO'}</span>
                  <span class="rule-id">${finding.rule_id || finding.type || 'unknown'}</span>
                </div>
                <div class="finding-desc">${finding.description || finding.message || 'Aucune description'}</div>
                ${finding.location ? `<div class="finding-location">📍 Emplacement: ${finding.location}</div>` : ''}
              </div>
            `).join('')}
          ` : `
            <div class="empty-state">
              <div class="check-icon">✅</div>
              <strong>Aucun problème détecté</strong>
              <p>Votre pipeline semble sain et sécurisé.</p>
            </div>
          `}
        </div>

        <div class="footer">
          <p>Rapport généré par <strong>SecFlowCheck</strong> - Analyse de sécurité CI/CD</p>
        </div>
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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-500" size={48} />
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-slate-900/30 border border-red-800 rounded-xl">
          <p className="text-red-400">{error}</p>
          <button onClick={fetchReports} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">Réessayer</button>
        </div>
      ) : reports.length === 0 ? (
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
                  <th className="px-6 py-4 font-medium">Features</th>
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
                        <div className={`w-2 h-2 rounded-full ${report.score === 'LOW' ? 'bg-emerald-500' :
                          report.score === 'MEDIUM' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                        <span className={`font-medium ${report.score === 'LOW' ? 'text-emerald-500' :
                          report.score === 'MEDIUM' ? 'text-yellow-500' : 'text-red-500'
                          }`}>
                          {report.score} ({report.grade})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400" title="Jobs">
                          {report.features?.num_jobs || 0} jobs
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-400" title="Steps">
                          {report.features?.num_steps || 0} steps
                        </span>
                        {report.features?.has_secrets && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400" title="Secrets détectés">
                            🔑 Secrets
                          </span>
                        )}
                        {report.features?.privileged_access && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-500/20 text-orange-400" title="Accès privilégié">
                            🔒 Privileged
                          </span>
                        )}
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
                          onClick={() => setSelectedReport(report)}
                          className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          title="Voir détails"
                        >
                          <Eye size={18} />
                        </button>
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

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 text-blue-500 rounded-lg">
                  <FileText size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedReport.fileName}</h2>
                  <p className="text-slate-400 text-sm">
                    {new Date(selectedReport.date).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm">Score</span>
                    <Shield size={18} className="text-blue-500" />
                  </div>
                  <div className={`text-2xl font-bold ${selectedReport.score === 'LOW' ? 'text-emerald-500' :
                    selectedReport.score === 'MEDIUM' ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                    {selectedReport.grade}
                  </div>
                  <p className="text-slate-500 text-xs">Grade: {selectedReport.score}</p>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm">Secrets</span>
                    <AlertTriangle size={18} className={selectedReport.features.has_secrets ? 'text-red-500' : 'text-emerald-500'} />
                  </div>
                  <div className={`text-2xl font-bold ${selectedReport.features.has_secrets ? 'text-red-500' : 'text-emerald-500'}`}>
                    {selectedReport.features.has_secrets ? 'OUI' : 'NON'}
                  </div>
                  <p className="text-slate-500 text-xs">{selectedReport.features.has_secrets ? 'Attention requise' : 'Aucun secret'}</p>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm">Accès Privilégiés</span>
                    <AlertTriangle size={18} className={selectedReport.features.privileged_access ? 'text-orange-500' : 'text-emerald-500'} />
                  </div>
                  <div className={`text-2xl font-bold ${selectedReport.features.privileged_access ? 'text-orange-500' : 'text-emerald-500'}`}>
                    {selectedReport.features.privileged_access ? 'OUI' : 'NON'}
                  </div>
                  <p className="text-slate-500 text-xs">{selectedReport.features.privileged_access ? 'Attention requise' : 'Aucun accès'}</p>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm">Problèmes</span>
                    <CheckCircle size={18} className={selectedReport.issuesCount > 0 ? 'text-red-500' : 'text-emerald-500'} />
                  </div>
                  <div className={`text-2xl font-bold ${selectedReport.issuesCount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {selectedReport.issuesCount}
                  </div>
                  <p className="text-slate-500 text-xs">{selectedReport.features.num_jobs} jobs, {selectedReport.features.num_steps} steps</p>
                </div>
              </div>

              {/* Findings */}
              <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Détails des vulnérabilités</h3>
                {selectedReport.result?.findings?.length > 0 ? (
                  <div className="space-y-3">
                    {selectedReport.result.findings.map((finding: any, idx: number) => (
                      <div key={idx} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${finding.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                            finding.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                              finding.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-blue-500/20 text-blue-400'
                            }`}>
                            {finding.severity || 'INFO'}
                          </span>
                          <span className="text-slate-500 text-sm">Règle: {finding.rule_id}</span>
                        </div>
                        <p className="text-white">{finding.description}</p>
                        {finding.location && (
                          <p className="text-slate-400 text-sm mt-1">📍 {finding.location}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle size={48} className="text-emerald-500 mx-auto mb-3" />
                    <p className="text-white font-medium">Aucun problème détecté</p>
                    <p className="text-slate-400 text-sm">Votre pipeline semble sain.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
              <button
                onClick={() => {
                  downloadReport(selectedReport)
                  setSelectedReport(null)
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <Download size={18} />
                Télécharger
              </button>
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
