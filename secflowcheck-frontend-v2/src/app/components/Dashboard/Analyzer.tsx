'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Upload, FileCode, X, Play, CheckCircle, AlertTriangle, Loader2,
  FileText, Download, Github, GitlabIcon, FolderGit2, RefreshCcw,
  ChevronRight, Shield, Activity
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

// --- Interfaces ---
interface Repo {
  id: string | number
  name: string
  full_name: string
  provider: 'github' | 'gitlab'
}

interface Pipeline {
  name: string
  path: string
  content?: string
}

interface AnalysisResult {
  pipeline_name: string
  score: string
  grade: string
  findings: any[]
  total_findings: number
  features: {
    num_jobs: number
    num_steps: number
    has_secrets: boolean
    privileged_access: boolean
  }
}

type AnalysisMode = 'repos' | 'manual'

export default function Analyzer() {
  // Mode state
  const [mode, setMode] = useState<AnalysisMode>('manual')
  const [isOAuthConnected, setIsOAuthConnected] = useState(false)
  const [oauthProvider, setOauthProvider] = useState<'github' | 'gitlab' | null>(null)

  // Repos mode state
  const [repos, setRepos] = useState<Repo[]>([])
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null)
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [loadingPipelines, setLoadingPipelines] = useState(false)

  // Manual mode state
  const [file, setFile] = useState<File | null>(null)
  const [yamlContent, setYamlContent] = useState('')
  const [fileName, setFileName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)

  // Check OAuth connection on mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    const provider = localStorage.getItem('oauth_provider')
    if (token && provider) {
      setIsOAuthConnected(true)
      setOauthProvider(provider as 'github' | 'gitlab')
      setMode('repos')
    }
  }, [])

  // Fetch repos when connected
  const fetchRepos = async () => {
    setLoadingRepos(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:8080/repos/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setRepos(data.repos || data || [])
      }
    } catch (err) {
      console.error('Failed to fetch repos:', err)
      toast.error('Échec du chargement des dépôts')
    } finally {
      setLoadingRepos(false)
    }
  }

  useEffect(() => {
    if (isOAuthConnected && mode === 'repos' && repos.length === 0) {
      fetchRepos()
    }
  }, [isOAuthConnected, mode])

  // Fetch pipelines for selected repo
  const fetchPipelines = async (repo: Repo) => {
    setLoadingPipelines(true)
    setPipelines([])
    try {
      const token = localStorage.getItem('token')
      const foundPipelines: Pipeline[] = []

      // For GitHub, check .github/workflows directory
      if (repo.provider === 'github') {
        try {
          const res = await fetch(`http://localhost:8080/repos/${repo.full_name}/contents?path=.github/workflows`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (res.ok) {
            const data = await res.json()
            const yamlFiles = (data || []).filter((f: any) =>
              f.type === 'file' && (f.name.endsWith('.yml') || f.name.endsWith('.yaml'))
            )
            yamlFiles.forEach((f: any) => foundPipelines.push({ name: f.name, path: f.path }))
          }
        } catch (e) {
          console.log('No .github/workflows found')
        }
      }

      // Also check root directory for any YAML files
      try {
        const res = await fetch(`http://localhost:8080/repos/${repo.full_name}/contents`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          const yamlFiles = (data || []).filter((f: any) =>
            f.type === 'file' && (f.name.endsWith('.yml') || f.name.endsWith('.yaml'))
          )
          yamlFiles.forEach((f: any) => {
            // Avoid duplicates
            if (!foundPipelines.some(p => p.path === f.path)) {
              foundPipelines.push({ name: f.name, path: f.path })
            }
          })
        }
      } catch (e) {
        console.log('Error fetching root contents')
      }

      setPipelines(foundPipelines)
    } catch (err) {
      console.error('Failed to fetch pipelines:', err)
    } finally {
      setLoadingPipelines(false)
    }
  }

  // File handling for manual mode
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  const handleFileUpload = async (uploadedFile: File) => {
    const name = uploadedFile.name.toLowerCase()
    if (!name.endsWith('.yml') && !name.endsWith('.yaml')) {
      toast.error('Veuillez sélectionner un fichier YAML (.yml ou .yaml)')
      return
    }

    setFile(uploadedFile)
    setFileName(uploadedFile.name)
    const content = await uploadedFile.text()
    setYamlContent(content)
    setAnalysisResult(null)
  }

  const removeFile = () => {
    setFile(null)
    setYamlContent('')
    setFileName('')
    setAnalysisResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Analysis function
  const startAnalysis = async (content: string, name: string) => {
    setIsAnalyzing(true)
    const toastId = toast.loading('Analyse en cours...')

    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('Vous devez être connecté')

      // Step 1: Parse
      const parseRes = await fetch('http://localhost:8080/parser/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content, filename: name })
      })

      if (!parseRes.ok) {
        if (parseRes.status === 401) throw new Error('Session expirée')
        throw new Error('Échec du parsing')
      }
      const parsedData = await parseRes.json()

      // Step 2: Analyze
      const analyzeRes = await fetch('http://localhost:8080/analyzer/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(parsedData)
      })

      if (!analyzeRes.ok) {
        if (analyzeRes.status === 401) throw new Error('Session expirée')
        throw new Error('Échec de l\'analyse')
      }
      const result = await analyzeRes.json()

      setAnalysisResult(result)
      toast.success('Analyse terminée!', { id: toastId })

    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erreur', { id: toastId })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const analyzeManual = () => {
    if (!yamlContent.trim()) {
      toast.error('Veuillez fournir du contenu YAML')
      return
    }
    startAnalysis(yamlContent, fileName || 'pipeline.yml')
  }

  const analyzePipeline = async (pipeline: Pipeline) => {
    if (pipeline.content) {
      startAnalysis(pipeline.content, pipeline.name)
    } else {
      // Fetch content first
      try {
        const token = localStorage.getItem('token')
        // Use /file/ endpoint (not /files/) and don't encode the path since it contains slashes
        const res = await fetch(`http://localhost:8080/repos/${selectedRepo?.full_name}/file/${pipeline.path}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          startAnalysis(data.content, pipeline.name)
        } else {
          toast.error('Impossible de récupérer le fichier')
        }
      } catch (err) {
        toast.error('Erreur lors de la récupération du fichier')
      }
    }
  }

  const resetAnalysis = () => {
    setAnalysisResult(null)
    setSelectedRepo(null)
    setPipelines([])
    removeFile()
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Toaster position="top-right" />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".yml,.yaml"
        className="hidden"
      />

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
          <Activity className="text-blue-500" />
          Analyseur de Pipeline CI/CD
        </h2>
        <p className="text-slate-400">
          {isOAuthConnected
            ? `Connecté via ${oauthProvider === 'github' ? 'GitHub' : 'GitLab'} - Sélectionnez un dépôt ou importez manuellement`
            : 'Importez votre fichier pipeline YAML pour détecter les vulnérabilités'
          }
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setMode('repos'); resetAnalysis() }}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${mode === 'repos'
            ? 'bg-blue-600 text-white'
            : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
        >
          <FolderGit2 size={18} />
          Mes Dépôts
        </button>
        <button
          onClick={() => { setMode('manual'); resetAnalysis() }}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${mode === 'manual'
            ? 'bg-blue-600 text-white'
            : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
        >
          <Upload size={18} />
          Import Manuel
        </button>
      </div>

      {/* Analysis Result */}
      {analysisResult ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FileCode className="text-blue-500" />
              Résultat: {analysisResult.pipeline_name}
            </h3>
            <button
              onClick={resetAnalysis}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center gap-2"
            >
              <RefreshCcw size={18} />
              Nouvelle analyse
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
              <p className="text-slate-400 text-sm mb-1">Score</p>
              <p className={`text-2xl font-bold ${analysisResult.score === 'LOW' ? 'text-emerald-500' :
                analysisResult.score === 'MEDIUM' ? 'text-yellow-500' : 'text-red-500'
                }`}>{analysisResult.grade}</p>
              <p className="text-slate-500 text-xs">{analysisResult.score}</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
              <p className="text-slate-400 text-sm mb-1">Secrets</p>
              <p className={`text-2xl font-bold ${analysisResult.features.has_secrets ? 'text-red-500' : 'text-emerald-500'}`}>
                {analysisResult.features.has_secrets ? 'OUI' : 'NON'}
              </p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
              <p className="text-slate-400 text-sm mb-1">Accès Privilégiés</p>
              <p className={`text-2xl font-bold ${analysisResult.features.privileged_access ? 'text-orange-500' : 'text-emerald-500'}`}>
                {analysisResult.features.privileged_access ? 'OUI' : 'NON'}
              </p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
              <p className="text-slate-400 text-sm mb-1">Problèmes</p>
              <p className="text-2xl font-bold text-white">{analysisResult.total_findings}</p>
              <p className="text-slate-500 text-xs">{analysisResult.features.num_jobs} jobs, {analysisResult.features.num_steps} steps</p>
            </div>
          </div>

          {/* Findings */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h4 className="text-lg font-semibold text-white">Vulnérabilités détectées</h4>
            </div>
            {analysisResult.findings.length > 0 ? (
              <div className="divide-y divide-slate-800">
                {analysisResult.findings.map((f, i) => (
                  <div key={i} className="p-4 hover:bg-slate-800/30">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${f.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                        f.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                          f.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                        }`}>{f.severity}</span>
                      <span className="text-slate-500 text-sm">{f.rule_id}</span>
                    </div>
                    <p className="text-white">{f.description}</p>
                    {f.location && <p className="text-slate-400 text-sm mt-1">📍 {f.location}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <CheckCircle size={48} className="text-emerald-500 mx-auto mb-2" />
                <p className="text-white font-medium">Aucun problème détecté</p>
                <p className="text-slate-400 text-sm">Votre pipeline semble sécurisé</p>
              </div>
            )}
          </div>
        </div>
      ) : mode === 'repos' ? (
        /* Repos Mode */
        <div className="space-y-6">
          {!isOAuthConnected ? (
            /* Connect to OAuth */
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center">
              <FolderGit2 size={48} className="text-slate-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Connectez votre compte</h3>
              <p className="text-slate-400 mb-6">Connectez-vous via GitHub ou GitLab pour accéder à vos dépôts et pipelines</p>
              <div className="flex justify-center gap-4">
                <a
                  href="http://localhost:8080/auth/login/oauth/github"
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center gap-2 transition-colors border border-slate-700"
                >
                  <Github size={20} />
                  GitHub
                </a>
                <a
                  href="http://localhost:8080/auth/login/oauth/gitlab"
                  className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <FolderGit2 size={20} />
                  GitLab
                </a>
              </div>
            </div>
          ) : !selectedRepo ? (
            /* Repo List */
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Sélectionnez un dépôt</h3>
                <button onClick={fetchRepos} disabled={loadingRepos} className="text-blue-500 hover:text-blue-400">
                  <RefreshCcw size={18} className={loadingRepos ? 'animate-spin' : ''} />
                </button>
              </div>
              {loadingRepos ? (
                <div className="p-8 text-center">
                  <Loader2 className="animate-spin text-blue-500 mx-auto" size={32} />
                </div>
              ) : repos.length > 0 ? (
                <div className="divide-y divide-slate-800 max-h-[400px] overflow-y-auto">
                  {repos.map(repo => (
                    <button
                      key={repo.id}
                      onClick={() => { setSelectedRepo(repo); fetchPipelines(repo) }}
                      className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <FolderGit2 className="text-blue-500" size={20} />
                        <span className="text-white font-medium">{repo.name}</span>
                      </div>
                      <ChevronRight className="text-slate-500" size={18} />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400">
                  Aucun dépôt trouvé
                </div>
              )}
            </div>
          ) : (
            /* Pipeline List */
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                <div>
                  <button onClick={() => setSelectedRepo(null)} className="text-blue-500 text-sm hover:underline">
                    ← Retour
                  </button>
                  <h3 className="text-lg font-semibold text-white mt-1">{selectedRepo.name}</h3>
                </div>
              </div>
              {loadingPipelines ? (
                <div className="p-8 text-center">
                  <Loader2 className="animate-spin text-blue-500 mx-auto" size={32} />
                </div>
              ) : pipelines.length > 0 ? (
                <div className="divide-y divide-slate-800">
                  {pipelines.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => analyzePipeline(p)}
                      disabled={isAnalyzing}
                      className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <FileCode className="text-emerald-500" size={20} />
                        <span className="text-white">{p.name}</span>
                      </div>
                      <Play className="text-blue-500" size={18} />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400">
                  Aucun pipeline trouvé dans ce dépôt
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Manual Mode */
        <div className="space-y-6">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'
              }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {!file ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-blue-500">
                  <Upload size={32} />
                </div>
                <div>
                  <p className="text-lg font-medium text-white mb-1">Glissez-déposez votre fichier pipeline ici</p>
                  <p className="text-slate-500 text-sm mb-4">Supporte .yml et .yaml</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Parcourir les fichiers
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-lg border border-slate-700 max-w-lg mx-auto">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                    <FileCode size={24} />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <button onClick={removeFile} className="p-2 text-slate-400 hover:text-red-400">
                  <X size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Or paste content */}
          <div className="text-center text-slate-500 text-sm">— OU —</div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Collez votre contenu YAML</label>
            <textarea
              value={yamlContent}
              onChange={(e) => { setYamlContent(e.target.value); setFile(null) }}
              placeholder="name: CI&#10;on: push&#10;jobs:&#10;  build:&#10;    runs-on: ubuntu-latest&#10;    steps:&#10;      - uses: actions/checkout@v3"
              className="w-full h-48 bg-slate-900 border border-slate-700 rounded-lg p-4 text-white font-mono text-sm resize-none focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Nom du fichier (ex: ci.yml)"
              className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Analyze Button */}
          {yamlContent && (
            <div className="flex justify-center">
              <button
                onClick={analyzeManual}
                disabled={isAnalyzing}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all ${isAnalyzing
                  ? 'bg-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-900/20'
                  }`}
              >
                {isAnalyzing ? (
                  <><Loader2 className="animate-spin" size={20} /> Analyse en cours...</>
                ) : (
                  <><Play size={20} /> Lancer l'analyse</>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
