'use client'

import React from 'react'
import {
  LayoutDashboard,
  AlertTriangle,
  CheckCircle,
  Plus,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

// --- Mock Data ---

const kpiData = {
  totalRepos: 42,
  securityScore: 88,
  criticalIssues: 7,
}

const trendData = [
  { date: '10 Nov', score: 65 },
  { date: '15 Nov', score: 70 },
  { date: '20 Nov', score: 68 },
  { date: '25 Nov', score: 75 },
  { date: '30 Nov', score: 82 },
  { date: '05 Déc', score: 85 },
  { date: '10 Déc', score: 88 },
]

const distributionData = [
  { name: 'Critique', value: 7, color: '#ef4444' }, // red-500
  { name: 'Élevée', value: 15, color: '#f97316' },    // orange-500
  { name: 'Moyenne', value: 24, color: '#eab308' },  // yellow-500
  { name: 'Faible', value: 45, color: '#22c55e' },    // green-500
]

const recentScans = [
  {
    id: 1,
    project: 'secflowcheck-auth',
    platform: 'GitHub',
    status: 'Succès',
    score: 92,
    date: 'il y a 2 min',
  },
  {
    id: 2,
    project: 'secflowcheck-api',
    platform: 'GitLab',
    status: 'Échec',
    score: 45,
    date: 'il y a 15 min',
  },
  {
    id: 3,
    project: 'frontend-v2',
    platform: 'GitHub',
    status: 'Succès',
    score: 88,
    date: 'il y a 1 h',
  },
  {
    id: 4,
    project: 'payment-service',
    platform: 'GitLab',
    status: 'Avertissement',
    score: 76,
    date: 'il y a 3 h',
  },
  {
    id: 5,
    project: 'legacy-parser',
    platform: 'GitHub',
    status: 'Succès',
    score: 85,
    date: 'il y a 5 h',
  },
]

// --- Components ---

const KPICard = ({ title, value, subtext, icon: Icon, colorClass }: { title: string, value: string | number, subtext?: string, icon?: any, colorClass?: string }) => (
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

const StatusBadge = ({ status }: { status: string }) => {
  let styles = 'bg-slate-800 text-slate-400'
  if (status === 'Succès') styles = 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
  if (status === 'Échec') styles = 'bg-red-500/10 text-red-500 border border-red-500/20'
  if (status === 'Avertissement') styles = 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles}`}>
      {status}
    </span>
  )
}

export default function SecFlowCheckDashboard() {
  return (
    <>
      {/* Row 1: KPI Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <KPICard 
          title='Dépôts surveillés' 
          value={kpiData.totalRepos} 
          icon={LayoutDashboard}
          colorClass='text-blue-500'
        />
        <KPICard 
          title='Score de sécurité global' 
          value={`${kpiData.securityScore}/100`} 
          subtext='Top 10% des organisations sécurisées'
          icon={CheckCircle}
          colorClass='text-emerald-500'
        />
        <KPICard 
          title='Problèmes critiques' 
          value={kpiData.criticalIssues} 
          subtext='Nécessite une attention immédiate'
          icon={AlertTriangle}
          colorClass='text-red-500'
        />
        
        <button className='bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-colors group shadow-lg shadow-blue-900/20'>
          <div className='w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform'>
            <Plus size={24} />
          </div>
          <span className='font-semibold'>Nouvelle intégration</span>
        </button>
      </div>

      {/* Row 2: Charts */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        
        {/* Chart 1: Trend */}
        <div className='lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-6'>
          <h3 className='text-lg font-semibold text-white mb-6'>Tendance des vulnérabilités (30 jours)</h3>
          <div className='h-[300px] w-full'>
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id='colorScore' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor='#3b82f6' stopOpacity={0.3}/>
                    <stop offset='95%' stopColor='#3b82f6' stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray='3 3' stroke='#1e293b' vertical={false} />
                <XAxis 
                  dataKey='date' 
                  stroke='#64748b' 
                  tick={{fill: '#64748b', fontSize: 12}} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke='#64748b' 
                  tick={{fill: '#64748b', fontSize: 12}} 
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Area 
                  type='monotone' 
                  dataKey='score' 
                  stroke='#3b82f6' 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill='url(#colorScore)' 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Distribution */}
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
                <Legend 
                  verticalAlign='bottom' 
                  height={36}
                  iconType='circle'
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pb-8'>
              <div className='text-2xl font-bold text-white'>91</div>
              <div className='text-xs text-slate-500'>Total des problèmes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Recent Scans Table */}
      <div className='bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden'>
        <div className='p-6 border-b border-slate-800 flex justify-between items-center'>
          <h3 className='text-lg font-semibold text-white'>Analyses de pipeline récentes</h3>
          <button className='text-sm text-blue-500 hover:text-blue-400 font-medium'>Voir tout</button>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-left border-collapse'>
            <thead>
              <tr className='bg-slate-900/50 text-slate-400 text-sm uppercase tracking-wider'>
                <th className='px-6 py-4 font-medium'>Nom du projet</th>
                <th className='px-6 py-4 font-medium'>Plateforme</th>
                <th className='px-6 py-4 font-medium'>Statut</th>
                <th className='px-6 py-4 font-medium'>Score de sécurité</th>
                <th className='px-6 py-4 font-medium text-right'>Action</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-800'>
              {recentScans.map((scan) => (
                <tr key={scan.id} className='hover:bg-slate-800/30 transition-colors'>
                  <td className='px-6 py-4'>
                    <div className='font-medium text-white'>{scan.project}</div>
                    <div className='text-xs text-slate-500'>{scan.date}</div>
                  </td>
                  <td className='px-6 py-4 text-slate-300'>
                    <div className='flex items-center gap-2'>
                      {/* Simple icons for platforms */}
                      {scan.platform === 'GitHub' ? (
                        <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'><path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z'/></svg>
                      ) : (
                        <svg className='w-4 h-4 text-orange-500' fill='currentColor' viewBox='0 0 24 24'><path d='M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .41.26l2.47 7.6h8.6l2.47-7.6a.43.43 0 0 1 .41-.26.42.42 0 0 1 .11.02l2.44 7.51 1.22 3.78a.84.84 0 0 1-.3.94zM24 14.87a.86.86 0 0 1-1.24.15L12 7.54 1.24 15.02a.86.86 0 0 1-1.24-.15.86.86 0 0 1 .15-1.24l11.2-7.78a.86.86 0 0 1 1.3 0l11.2 7.78a.86.86 0 0 1 .15 1.24z'/></svg>
                      )}
                      {scan.platform}
                    </div>
                  </td>
                  <td className='px-6 py-4'>
                    <StatusBadge status={scan.status} />
                  </td>
                  <td className='px-6 py-4'>
                    <div className='flex items-center gap-2'>
                      <div className='w-24 h-2 bg-slate-800 rounded-full overflow-hidden'>
                        <div 
                          className={`h-full rounded-full ${
                            scan.score > 80 ? 'bg-emerald-500' : scan.score > 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`} 
                          style={{ width: `${scan.score}%` }}
                        />
                      </div>
                      <span className='text-sm font-medium text-slate-300'>{scan.score}</span>
                    </div>
                  </td>
                  <td className='px-6 py-4 text-right'>
                    <button className='text-blue-500 hover:text-blue-400 text-sm font-medium hover:underline'>
                      Voir le rapport
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
