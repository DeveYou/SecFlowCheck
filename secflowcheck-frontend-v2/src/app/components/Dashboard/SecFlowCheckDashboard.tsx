'use client'

import React, { useState } from 'react'
import NewProjectModal from './NewProjectModal'
import {
  LayoutDashboard,
  AlertTriangle,
  CheckCircle,
  Plus,
  Loader2,
  FileCode
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import toast, { Toaster } from 'react-hot-toast'

// --- Interfaces ---

interface Finding {
  id: string
  title: string
  severity: string
  line: number
  column: number
  message: string
}

interface AnalysisResult {
  filename: string
  risk_score: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'UNKNOWN'
  grade: string
  findings: Finding[]
  features: {
    num_jobs: number
    num_steps: number
    has_secrets: boolean
    privileged_access: boolean
  }
}

// --- Components ---

const KPICard = ({ title, value, subtext, icon: Icon, colorClass }: { title: string, value: string | number | React.ReactNode, subtext?: string, icon?: any, colorClass?: string }) => (
  <div className='bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex flex-col justify-between h-full'>
    <div className='flex justify-between items-start mb-4'>
      <h3 className='text-slate-400 text-sm font-medium'>{title}</h3>
      {Icon && <Icon className={`opacity-80 ${colorClass}`} size={20} />}
    </div>
    <div>
      <div className={`text-3xl font-bold ${colorClass || 'text-white'}`}>{value}</div>
      {subtext && <p className='text-slate-500 text-xs mt-1'>{subtext}</p>}
    </div>
  </div>
)

const StatusBadge = ({ severity }: { severity: string }) => {
  let styles = 'bg-slate-800 text-slate-400'
  if (severity === 'LOW') styles = 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
  if (severity === 'MEDIUM') styles = 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
  if (severity === 'HIGH') styles = 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
  if (severity === 'CRITICAL') styles = 'bg-red-500/10 text-red-500 border border-red-500/20'

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles}`}>
      {severity}
    </span>
  )
}

export default function SecFlowCheckDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)

  const handleProjectSubmit = async (yamlContent: string, projectName: string) => {
    // 1. Validation
    const isValidPipeline =
      yamlContent.includes('jobs:') ||
      yamlContent.includes('stages:') ||
      yamlContent.includes('pipeline:') ||
      yamlContent.includes('on:') // GitHub Actions specific

    if (!isValidPipeline) {
      toast.error("Le fichier ne semble pas être un pipeline CI/CD valide (mots-clés manquants)")
      return
    }

    setIsAnalyzing(true)
    const toastId = toast.loading('Analyse en cours...')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error("Vous devez être connecté pour effectuer une analyse")
      }

      // 2. Parse
      const parseRes = await fetch('http://localhost:8080/parser/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: yamlContent, filename: projectName })
      })

      if (!parseRes.ok) {
        if (parseRes.status === 401) throw new Error("Session expirée. Veuillez vous reconnecter.")
        throw new Error("Échec du parsing du fichier")
      }
      const parsedData = await parseRes.json()

      // 3. Analyze
      const analyzeRes = await fetch('http://localhost:8080/analyzer/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(parsedData)
      })

      if (!analyzeRes.ok) {
        if (analyzeRes.status === 401) throw new Error("Session expirée. Veuillez vous reconnecter.")
        throw new Error("Échec de l'analyse")
      }
      const analysisData = await analyzeRes.json()

      setAnalysisResult(analysisData)
      toast.success('Analyse terminée avec succès', { id: toastId })

    } catch (e: any) {
      console.error(e)
      toast.error(e.message || "Une erreur est survenue", { id: toastId })
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Data for Charts (Derived from analysisResult)
  const distributionData = analysisResult ? [
    { name: 'Critique', value: analysisResult.findings.filter(f => f.severity === 'CRITICAL').length, color: '#ef4444' },
    { name: 'Élevée', value: analysisResult.findings.filter(f => f.severity === 'HIGH').length, color: '#f97316' },
    { name: 'Moyenne', value: analysisResult.findings.filter(f => f.severity === 'MEDIUM').length, color: '#eab308' },
    { name: 'Faible', value: analysisResult.findings.filter(f => f.severity === 'LOW').length, color: '#22c55e' },
  ].filter(d => d.value > 0) : []

  return (
    <>
      <Toaster position="top-right" />

      {/* Overview or Empty State */}
      {!analysisResult && !isAnalyzing && (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="bg-slate-800 p-6 rounded-full mb-6 relative group">
            <LayoutDashboard size={64} className="text-slate-500 group-hover:text-blue-500 transition-colors" />
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Aucune analyse pour le moment</h2>
          <p className="text-slate-400 max-w-md mb-8">
            Importez un fichier de pipeline CI/CD (GitHub Actions, GitLab CI) pour détecter les vulnérabilités de sécurité et obtenir un rapport détaillé.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className='bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 py-4 flex items-center gap-3 transition-all shadow-lg shadow-blue-900/20 hover:scale-105'
          >
            <Plus size={24} />
            <span className='font-semibold'>Lancer une nouvelle analyse</span>
          </button>
        </div>
      )}

      {isAnalyzing && (
        <div className="flex flex-col items-center justify-center p-20">
          <Loader2 size={64} className="animate-spin text-blue-500 mb-6" />
          <h2 className="text-2xl font-bold text-white">Analyse en cours...</h2>
          <p className="text-slate-400 mt-2">Nous inspectons votre pipeline à la recherche de failles de sécurité.</p>
        </div>
      )}

      {analysisResult && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <FileCode className="text-blue-500" />
                Rapport d'analyse: {analysisResult.filename}
              </h2>
              <p className="text-slate-400 text-sm mt-1">Généré à l'instant • Note de sécurité: {analysisResult.grade}</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className='bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-4 py-2 flex items-center gap-2 transition-colors border border-slate-700'
            >
              <Plus size={18} />
              <span>Nouvelle analyse</span>
            </button>
          </div>

          {/* KPI Row */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <KPICard
              title='Score de Risque'
              value={analysisResult.risk_score}
              subtext={`Grade: ${analysisResult.grade}`}
              icon={LayoutDashboard}
              colorClass={
                analysisResult.risk_score === 'CRITICAL' ? 'text-red-500' :
                  analysisResult.risk_score === 'HIGH' ? 'text-orange-500' :
                    analysisResult.risk_score === 'MEDIUM' ? 'text-yellow-500' : 'text-emerald-500'
              }
            />
            <KPICard
              title='Secrets Détectés'
              value={analysisResult.features.has_secrets ? 'OUI' : 'NON'}
              subtext={analysisResult.features.has_secrets ? 'Attention requise' : 'Aucun secret trouvé'}
              icon={AlertTriangle}
              colorClass={analysisResult.features.has_secrets ? 'text-red-500' : 'text-emerald-500'}
            />
            <KPICard
              title='Accès Privilégiés'
              value={analysisResult.features.privileged_access ? 'OUI' : 'NON'}
              icon={AlertTriangle}
              colorClass={analysisResult.features.privileged_access ? 'text-orange-500' : 'text-slate-200'}
            />
            <KPICard
              title='Total Problèmes'
              value={analysisResult.findings.length}
              subtext={`${analysisResult.findings.filter(f => f.severity === 'CRITICAL').length} Critiques`}
              icon={CheckCircle}
              colorClass='text-blue-500'
            />
          </div>

          {/* Charts & Findings */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>

            {/* Chart: Distribution */}
            {distributionData.length > 0 ? (
              <div className='bg-slate-900/50 border border-slate-800 rounded-xl p-6'>
                <h3 className='text-lg font-semibold text-white mb-6'>Distribution par sévérité</h3>
                <div className='h-[300px] w-full relative'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <PieChart>
                      <Pie
                        data={distributionData}
                        cx='50%'
                        cy='50%'
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey='value'
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke='rgba(0,0,0,0)' />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                      />
                      <Legend verticalAlign='bottom' height={36} iconType='circle' />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pb-8'>
                    <div className='text-2xl font-bold text-white'>{analysisResult.findings.length}</div>
                    <div className='text-xs text-slate-500'>Problèmes</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className='bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center'>
                <CheckCircle size={48} className="text-emerald-500 mb-4" />
                <h3 className="text-lg font-medium text-white">Aucun problème détecté</h3>
                <p className="text-slate-500 text-sm mt-2">Votre pipeline semble sain.</p>
              </div>
            )}

            {/* Findings List */}
            <div className='lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden flex flex-col'>
              <div className='p-6 border-b border-slate-800'>
                <h3 className='text-lg font-semibold text-white'>Détails des vulnérabilités</h3>
              </div>
              <div className='overflow-y-auto max-h-[360px] p-0'>
                {analysisResult.findings.length > 0 ? (
                  <table className='w-full text-left border-collapse'>
                    <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-sm z-10">
                      <tr className='text-slate-400 text-sm uppercase tracking-wider border-b border-slate-800'>
                        <th className='px-6 py-4 font-medium'>Sévérité</th>
                        <th className='px-6 py-4 font-medium'>Problème</th>
                        <th className='px-6 py-4 font-medium'>Ligne</th>
                        <th className='px-6 py-4 font-medium'>Description</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-slate-800'>
                      {analysisResult.findings.map((finding, idx) => (
                        <tr key={idx} className='hover:bg-slate-800/30 transition-colors group'>
                          <td className='px-6 py-4'>
                            <StatusBadge severity={finding.severity} />
                          </td>
                          <td className='px-6 py-4 font-medium text-white'>{finding.title}</td>
                          <td className='px-6 py-4 text-slate-400 font-mono text-xs'>L:{finding.line}</td>
                          <td className='px-6 py-4 text-slate-400 text-sm'>{finding.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    Aucune vulnérabilité trouvée.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleProjectSubmit}
      />
    </>
  )
}
