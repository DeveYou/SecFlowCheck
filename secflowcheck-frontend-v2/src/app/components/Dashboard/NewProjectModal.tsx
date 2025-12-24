'use client'

import React, { useState, useEffect } from 'react'
import { X, Upload, Github, FolderOpen, FileCode, ChevronRight, Loader2 } from 'lucide-react'

interface Repository {
    id: number
    name: string
    full_name: string
    default_branch: string
}

interface FileItem {
    name: string
    type: 'file' | 'dir'
    path: string
}

interface NewProjectModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (yamlContent: string, projectName: string) => void
}

export default function NewProjectModal({ isOpen, onClose, onSubmit }: NewProjectModalProps) {
    const [userProvider, setUserProvider] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Repo selection state
    const [repos, setRepos] = useState<Repository[]>([])
    const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)
    const [currentPath, setCurrentPath] = useState<string>('')
    const [files, setFiles] = useState<FileItem[]>([])
    const [selectedFile, setSelectedFile] = useState<string | null>(null)

    // Manual upload state
    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const [dragOver, setDragOver] = useState(false)

    // Get user's auth provider on mount
    useEffect(() => {
        if (isOpen) {
            fetchUserProvider()
        }
    }, [isOpen])

    const getToken = () => localStorage.getItem('token')

    const fetchUserProvider = async () => {
        try {
            const token = getToken()
            if (!token) {
                setUserProvider('local')
                return
            }

            const res = await fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (res.ok) {
                const user = await res.json()
                setUserProvider(user.provider)

                // If GitHub/GitLab, fetch repos
                if (user.provider === 'github' || user.provider === 'gitlab') {
                    fetchRepos()
                }
            } else {
                setUserProvider('local')
            }
        } catch {
            setUserProvider('local')
        }
    }

    const fetchRepos = async () => {
        setLoading(true)
        setError(null)
        try {
            const token = getToken()
            const res = await fetch('/api/repos/list', {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (res.ok) {
                const data = await res.json()
                setRepos(data)
            } else {
                const err = await res.json()
                setError(err.detail || 'Failed to fetch repositories')
            }
        } catch {
            setError('Failed to fetch repositories')
        } finally {
            setLoading(false)
        }
    }

    const fetchRepoContents = async (repo: Repository, path: string = '') => {
        setLoading(true)
        setError(null)
        try {
            const token = getToken()
            const res = await fetch(`/api/repos/${repo.full_name}/contents?path=${encodeURIComponent(path)}`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (res.ok) {
                const data = await res.json()
                setFiles(data)
                setCurrentPath(path)
            } else {
                const err = await res.json()
                setError(err.detail || 'Failed to fetch contents')
            }
        } catch {
            setError('Failed to fetch contents')
        } finally {
            setLoading(false)
        }
    }

    const handleRepoSelect = (repo: Repository) => {
        setSelectedRepo(repo)
        setSelectedFile(null)
        fetchRepoContents(repo, '')
    }

    const handleFileClick = async (file: FileItem) => {
        if (file.type === 'dir') {
            fetchRepoContents(selectedRepo!, file.path)
        } else {
            setSelectedFile(file.path)
        }
    }

    const handleGoBack = () => {
        if (currentPath) {
            const parentPath = currentPath.split('/').slice(0, -1).join('/')
            fetchRepoContents(selectedRepo!, parentPath)
        } else {
            setSelectedRepo(null)
            setFiles([])
        }
    }

    const handleSubmitRepo = async () => {
        if (!selectedRepo || !selectedFile) return

        setLoading(true)
        try {
            const token = getToken()
            const res = await fetch(`/api/repos/${selectedRepo.full_name}/file/${encodeURIComponent(selectedFile)}`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (res.ok) {
                const data = await res.json()
                onSubmit(data.content, selectedFile.split('/').pop() || 'project')
                onClose()
            } else {
                const err = await res.json()
                setError(err.detail || 'Failed to fetch file')
            }
        } catch {
            setError('Failed to fetch file')
        } finally {
            setLoading(false)
        }
    }

    const handleFileUpload = (file: File) => {
        if (file.name.endsWith('.yml') || file.name.endsWith('.yaml')) {
            setUploadedFile(file)
            setError(null)
        } else {
            setError('Please upload a .yml or .yaml file')
        }
    }

    const handleSubmitUpload = async () => {
        if (!uploadedFile) return

        const content = await uploadedFile.text()
        onSubmit(content, uploadedFile.name.replace(/\.(yml|yaml)$/, ''))
        onClose()
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFileUpload(file)
    }

    if (!isOpen) return null

    const isOAuthUser = userProvider === 'github' || userProvider === 'gitlab'

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <h2 className="text-xl font-semibold text-white">Nouveau Projet d'Analyse</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {loading && !repos.length && !files.length ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin text-blue-500" size={32} />
                        </div>
                    ) : isOAuthUser ? (
                        // OAuth User - Repo Selection
                        <div>
                            <div className="flex items-center gap-2 mb-4 text-slate-400">
                                <Github size={20} />
                                <span>Sélectionnez un fichier YAML depuis vos dépôts {userProvider === 'github' ? 'GitHub' : 'GitLab'}</span>
                            </div>

                            {!selectedRepo ? (
                                // Repo List
                                <div className="space-y-2">
                                    {repos.map((repo) => (
                                        <button
                                            key={repo.id}
                                            onClick={() => handleRepoSelect(repo)}
                                            className="w-full flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors text-left"
                                        >
                                            <FolderOpen className="text-blue-400" size={20} />
                                            <div>
                                                <div className="text-white font-medium">{repo.name}</div>
                                                <div className="text-slate-500 text-sm">{repo.full_name}</div>
                                            </div>
                                            <ChevronRight className="ml-auto text-slate-500" size={20} />
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                // File Browser
                                <div>
                                    <button
                                        onClick={handleGoBack}
                                        className="flex items-center gap-2 mb-4 text-blue-400 hover:text-blue-300"
                                    >
                                        <ChevronRight className="rotate-180" size={16} />
                                        {currentPath ? currentPath : selectedRepo.name}
                                    </button>

                                    <div className="space-y-2">
                                        {files.map((file) => (
                                            <button
                                                key={file.path}
                                                onClick={() => handleFileClick(file)}
                                                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${selectedFile === file.path
                                                    ? 'bg-blue-500/20 border-blue-500'
                                                    : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700'
                                                    }`}
                                            >
                                                {file.type === 'dir' ? (
                                                    <FolderOpen className="text-yellow-400" size={20} />
                                                ) : (
                                                    <FileCode className="text-green-400" size={20} />
                                                )}
                                                <span className="text-white">{file.name}</span>
                                                {file.type === 'dir' && (
                                                    <ChevronRight className="ml-auto text-slate-500" size={20} />
                                                )}
                                            </button>
                                        ))}

                                        {files.length === 0 && !loading && (
                                            <div className="text-center py-8 text-slate-500">
                                                Aucun fichier YAML trouvé dans ce dossier
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        // Local/Google User - File Upload
                        <div>
                            <div className="flex items-center gap-2 mb-4 text-slate-400">
                                <Upload size={20} />
                                <span>Téléchargez votre fichier de pipeline CI/CD</span>
                            </div>

                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${dragOver
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : uploadedFile
                                        ? 'border-green-500 bg-green-500/10'
                                        : 'border-slate-600 hover:border-slate-500'
                                    }`}
                            >
                                {uploadedFile ? (
                                    <div>
                                        <FileCode className="mx-auto text-green-400 mb-3" size={48} />
                                        <div className="text-white font-medium">{uploadedFile.name}</div>
                                        <div className="text-slate-500 text-sm mt-1">
                                            {(uploadedFile.size / 1024).toFixed(1)} KB
                                        </div>
                                        <button
                                            onClick={() => setUploadedFile(null)}
                                            className="mt-3 text-red-400 hover:text-red-300 text-sm"
                                        >
                                            Supprimer
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <Upload className="mx-auto text-slate-500 mb-3" size={48} />
                                        <div className="text-white">
                                            Glissez-déposez votre fichier ici
                                        </div>
                                        <div className="text-slate-500 text-sm mt-1">ou</div>
                                        <label className="inline-block mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors">
                                            <input
                                                type="file"
                                                accept=".yml,.yaml"
                                                className="hidden"
                                                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                                            />
                                            Parcourir
                                        </label>
                                        <div className="text-slate-600 text-xs mt-3">
                                            Formats acceptés: .yml, .yaml
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-slate-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={isOAuthUser ? handleSubmitRepo : handleSubmitUpload}
                        disabled={isOAuthUser ? !selectedFile : !uploadedFile}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                        {loading && <Loader2 className="animate-spin" size={16} />}
                        Analyser
                    </button>
                </div>
            </div>
        </div>
    )
}
