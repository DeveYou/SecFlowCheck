'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  AlertTriangle,
  Shield,
  TrendingUp,
  Activity,
  FileText,
  ArrowRight,
  Loader2,
  RefreshCcw
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts'
import toast, { Toaster } from 'react-hot-toast'

// --- Interfaces ---
interface ReportSummary {
  id: string
  pipeline_name: string
  score: string
  grade: string
  total_findings: number
  created_at: string
  features?: {
    num_jobs: number
    num_steps: number
    has_secrets: boolean
    privileged_access: boolean
  }
}

interface DashboardStats {
  totalAnalyses: number
  recentAnalyses: ReportSummary[]
  scoreDistribution: { name: string; value: number; color: string }[]
  secretsDetected: number
  privilegedAccess: number
  lastAnalysisDate: string | null
}

// --- Components ---
const KPICard = ({ title, value, subtext, icon: Icon, colorClass, trend }: {
  title: string
  value: string | number
  subtext?: string
  icon?: any
  colorClass?: string
  trend?: string
}) => (
  <div className='bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex flex-col justify-between h-full hover:border-slate-700 transition-colors'>
    <div className='flex justify-between items-start mb-4'>
      <h3 className='text-slate-400 text-sm font-medium'>{title}</h3>
      {Icon && <Icon className={`opacity-80 ${colorClass}`} size={20} />}
    </div>
    <div>
      <div className={`text-3xl font-bold ${colorClass || 'text-white'}`}>{value}</div>
      {subtext && <p className='text-slate-500 text-xs mt-1'>{subtext}</p>}
      {trend && <p className='text-emerald-500 text-xs mt-1 flex items-center gap-1'><TrendingUp size={12} />{trend}</p>}
    </div>
  </div>
)

const ScoreBadge = ({ score }: { score: string }) => {
  const styles =
    score === 'LOW' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
      score === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
        score === 'HIGH' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
          'bg-red-500/10 text-red-500 border-red-500/20'

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles}`}>
      {score}
    </span>
  )
}

export default function SecFlowCheckDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:8080/reports/', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })

      if (!res.ok) {
        throw new Error('Échec du chargement des statistiques')
      }

      const data = await res.json()
      const reports: ReportSummary[] = data.results || []

      // Calculate statistics
      const scoreCount = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
      let secretsCount = 0
      let privilegedCount = 0

      reports.forEach((r: any) => {
        const score = r.score || 'UNKNOWN'
        if (score in scoreCount) scoreCount[score as keyof typeof scoreCount]++

        const features = r.metadata?.features || r.features || {}
        if (features.has_secrets) secretsCount++
        if (features.privileged_access) privilegedCount++
      })

      const scoreDistribution = [
        { name: 'Critique', value: scoreCount.CRITICAL, color: '#ef4444' },
        { name: 'Élevé', value: scoreCount.HIGH, color: '#f97316' },
        { name: 'Moyen', value: scoreCount.MEDIUM, color: '#eab308' },
        { name: 'Faible', value: scoreCount.LOW, color: '#22c55e' },
      ].filter(d => d.value > 0)

      setStats({
        totalAnalyses: reports.length,
        recentAnalyses: reports.slice(0, 5).map((r: any) => ({
          id: r.id || r._id,
          pipeline_name: r.pipeline_name || 'Unknown',
          score: r.score || 'UNKNOWN',
          grade: r.grade || 'N/A',
          total_findings: r.total_findings || r.findings?.length || 0,
          created_at: r.created_at,
          features: r.metadata?.features || r.features
        })),
        scoreDistribution,
        secretsDetected: secretsCount,
        privilegedAccess: privilegedCount,
        lastAnalysisDate: reports.length > 0 ? reports[0].created_at : null
      })
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <Loader2 size={64} className="animate-spin text-blue-500 mb-6" />
        <h2 className="text-xl font-bold text-white">Chargement du tableau de bord...</h2>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <AlertTriangle size={64} className="text-red-500 mb-6" />
        <h2 className="text-xl font-bold text-white mb-2">Erreur de chargement</h2>
        <p className="text-slate-400 mb-6">{error}</p>
        <button onClick={fetchStats} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
          <RefreshCcw size={18} /> Réessayer
        </button>
      </div>
    )
  }

  const hasData = stats && stats.totalAnalyses > 0

  return (
    <>
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <LayoutDashboard className="text-blue-500" />
            Tableau de bord
          </h1>
          <p className="text-slate-400 text-sm mt-1">Vue d'ensemble de vos analyses de sécurité</p>
        </div>
        <Link
          href="/dashboard/scans"
          className='bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20 hover:scale-105'
        >
          <Activity size={20} />
          <span className='font-semibold'>Nouvelle analyse</span>
          <ArrowRight size={18} />
        </Link>
      </div>

      {!hasData ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-16 text-center bg-slate-900/30 border border-slate-800 rounded-2xl border-dashed">
          <div className="bg-slate-800 p-6 rounded-full mb-6 relative group">
            <Shield size={64} className="text-slate-500 group-hover:text-blue-500 transition-colors" />
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Aucune analyse pour le moment</h2>
          <p className="text-slate-400 max-w-md mb-8">
            Commencez par analyser votre premier pipeline CI/CD pour obtenir des insights de sécurité.
          </p>
          <Link
            href="/dashboard/scans"
            className='bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 py-4 flex items-center gap-3 transition-all shadow-lg shadow-blue-900/20 hover:scale-105'
          >
            <Activity size={24} />
            <span className='font-semibold'>Lancer votre première analyse</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Row */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <KPICard
              title='Total Analyses'
              value={stats?.totalAnalyses || 0}
              subtext='Pipelines analysés'
              icon={FileText}
              colorClass='text-blue-500'
            />
            <KPICard
              title='Secrets Détectés'
              value={stats?.secretsDetected || 0}
              subtext={`Sur ${stats?.totalAnalyses} analyses`}
              icon={AlertTriangle}
              colorClass={stats?.secretsDetected ? 'text-red-500' : 'text-emerald-500'}
            />
            <KPICard
              title='Accès Privilégiés'
              value={stats?.privilegedAccess || 0}
              subtext='Pipelines concernés'
              icon={Shield}
              colorClass={stats?.privilegedAccess ? 'text-orange-500' : 'text-emerald-500'}
            />
            <KPICard
              title='Dernière Analyse'
              value={stats?.lastAnalysisDate ? new Date(stats.lastAnalysisDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'N/A'}
              subtext={stats?.lastAnalysisDate ? new Date(stats.lastAnalysisDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
              icon={Activity}
              colorClass='text-purple-500'
            />
          </div>

          {/* Charts & Recent List */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>

            {/* Score Distribution Chart */}
            <div className='bg-slate-900/50 border border-slate-800 rounded-xl p-6'>
              <h3 className='text-lg font-semibold text-white mb-6'>Distribution des scores</h3>
              {stats?.scoreDistribution && stats.scoreDistribution.length > 0 ? (
                <div className='h-[280px] w-full relative'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <PieChart>
                      <Pie
                        data={stats.scoreDistribution}
                        cx='50%'
                        cy='50%'
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey='value'
                      >
                        {stats.scoreDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke='rgba(0,0,0,0)' />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }} />
                      <Legend verticalAlign='bottom' height={36} iconType='circle' />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pb-8'>
                    <div className='text-2xl font-bold text-white'>{stats.totalAnalyses}</div>
                    <div className='text-xs text-slate-500'>Analyses</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-slate-500">
                  Aucune donnée disponible
                </div>
              )}
            </div>

            {/* Recent Analyses List */}
            <div className='lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden'>
              <div className='p-6 border-b border-slate-800 flex justify-between items-center'>
                <h3 className='text-lg font-semibold text-white'>Analyses récentes</h3>
                <Link href="/dashboard/reports" className="text-blue-500 text-sm flex items-center gap-1 hover:underline">
                  Voir tout <ArrowRight size={14} />
                </Link>
              </div>
              <div className='overflow-y-auto max-h-[300px]'>
                {stats?.recentAnalyses && stats.recentAnalyses.length > 0 ? (
                  <table className='w-full text-left border-collapse'>
                    <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-sm z-10">
                      <tr className='text-slate-400 text-sm uppercase tracking-wider border-b border-slate-800'>
                        <th className='px-6 py-3 font-medium'>Pipeline</th>
                        <th className='px-6 py-3 font-medium'>Score</th>
                        <th className='px-6 py-3 font-medium'>Problèmes</th>
                        <th className='px-6 py-3 font-medium'>Date</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-slate-800'>
                      {stats.recentAnalyses.map((report, idx) => (
                        <tr key={idx} className='hover:bg-slate-800/30 transition-colors'>
                          <td className='px-6 py-4 font-medium text-white'>{report.pipeline_name}</td>
                          <td className='px-6 py-4'>
                            <ScoreBadge score={report.score} />
                          </td>
                          <td className='px-6 py-4 text-slate-400'>{report.total_findings}</td>
                          <td className='px-6 py-4 text-slate-400 text-sm'>
                            {new Date(report.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    Aucune analyse récente.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
