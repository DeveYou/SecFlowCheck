'use client'

import React, { useState, useRef } from 'react'
import { Upload, FileCode, X, Play, CheckCircle, AlertTriangle, Loader2, FileText, Download } from 'lucide-react'

export default function Analyzer() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.name.endsWith('.yml') || droppedFile.name.endsWith('.yaml')) {
        setFile(droppedFile)
        setAnalysisResult(null)
      } else {
        alert('Veuillez télécharger un fichier YAML (.yml ou .yaml)')
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      const fileName = selectedFile.name.toLowerCase()
      if (fileName.endsWith('.yml') || fileName.endsWith('.yaml')) {
        setFile(selectedFile)
        setAnalysisResult(null)
      } else {
        alert('Veuillez télécharger un fichier YAML (.yml ou .yaml)')
      }
    }
  }

  const removeFile = () => {
    setFile(null)
    setAnalysisResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const saveReportToHistory = (result: any) => {
    const newReport = {
      id: Date.now(),
      fileName: file?.name || 'pipeline.yml',
      date: new Date().toISOString(),
      score: result.score,
      status: result.status,
      issuesCount: result.issues.length,
      result: result
    }

    const existingReports = JSON.parse(localStorage.getItem('secflow_reports') || '[]')
    localStorage.setItem('secflow_reports', JSON.stringify([newReport, ...existingReports]))
  }

  const downloadReport = () => {
    if (!analysisResult || !file) return

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Rapport de Sécurité - ${file.name}</title>
        <style>
          body { font-family: system-ui, sans-serif; line-height: 1.5; max-width: 800px; margin: 0 auto; padding: 2rem; color: #1e293b; }
          h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 1rem; }
          .score-card { background: #f8fafc; padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 2rem; border: 1px solid #e2e8f0; }
          .score { font-size: 2.5rem; font-weight: bold; color: ${analysisResult.score > 80 ? '#10b981' : analysisResult.score > 50 ? '#eab308' : '#ef4444'}; }
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
          <p>Fichier: <strong>${file.name}</strong></p>
          <p>Date: ${new Date().toLocaleDateString('fr-FR')}</p>
          <p>Score de Sécurité</p>
          <div class="score">${analysisResult.score}/100</div>
        </div>
        <h2>Vulnérabilités Détectées (${analysisResult.issues.length})</h2>
        ${analysisResult.issues.map((issue: any) => `
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
    a.download = `rapport-securite-${file.name}-${Date.now()}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const startAnalysis = () => {
    if (!file) return

    setIsAnalyzing(true)
    
    // Simulate analysis delay
    setTimeout(() => {
      setIsAnalyzing(false)
      const result = {
        score: 85,
        status: 'Passed',
        issues: [
          { id: 1, severity: 'High', message: 'Utilisation de secrets en clair détectée', line: 12 },
          { id: 2, severity: 'Medium', message: 'Version de l\'image de base obsolète', line: 4 },
          { id: 3, severity: 'Low', message: 'Absence de limite de ressources', line: 22 },
        ]
      }
      setAnalysisResult(result)
      saveReportToHistory(result)
    }, 2000)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".yml,.yaml"
        className="hidden"
      />
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Analyseur de Pipeline CI/CD</h2>
        <p className="text-slate-400">Téléchargez votre fichier de configuration pipeline (YAML) pour détecter les vulnérabilités de sécurité et les mauvaises configurations.</p>
      </div>

      {/* Upload Area */}
      <div 
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
          isDragging 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'
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
            <button 
              onClick={removeFile}
              className="p-2 text-slate-400 hover:text-red-400 transition-colors"
              disabled={isAnalyzing}
            >
              <X size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Action Button */}
      {file && !analysisResult && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={startAnalysis}
            disabled={isAnalyzing}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all ${
              isAnalyzing 
                ? 'bg-slate-700 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-900/20'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Analyse en cours...
              </>
            ) : (
              <>
                <Play size={20} />
                Lancer l'analyse
              </>
            )}
          </button>
        </div>
      )}

      {/* Results Section */}
      {analysisResult && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-end mb-4">
            <button
              onClick={downloadReport}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
            >
              <Download size={18} />
              Télécharger le rapport
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-full">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Score de Sécurité</p>
                <p className="text-2xl font-bold text-white">{analysisResult.score}/100</p>
              </div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-full">
                <FileText size={24} />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Fichier Analysé</p>
                <p className="text-white font-medium truncate max-w-[150px]">{file?.name}</p>
              </div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-red-500/10 text-red-500 rounded-full">
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Problèmes Détectés</p>
                <p className="text-2xl font-bold text-white">{analysisResult.issues.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">Détails des vulnérabilités</h3>
            </div>
            <div className="divide-y divide-slate-800">
              {analysisResult.issues.map((issue: any) => (
                <div key={issue.id} className="p-6 hover:bg-slate-800/30 transition-colors flex items-start gap-4">
                  <div className={`mt-1 p-1.5 rounded-full ${
                    issue.severity === 'High' ? 'bg-red-500/10 text-red-500' :
                    issue.severity === 'Medium' ? 'bg-orange-500/10 text-orange-500' :
                    'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    <AlertTriangle size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-white font-medium">{issue.message}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        issue.severity === 'High' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                        issue.severity === 'Medium' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                        'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                      }`}>
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm">Ligne {issue.line} dans {file?.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
