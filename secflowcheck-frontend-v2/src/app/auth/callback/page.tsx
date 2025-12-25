'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

function AuthContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

    useEffect(() => {
        const token = searchParams.get('token')
        const error = searchParams.get('error')

        if (error) {
            setStatus('error')
            toast.error(`Erreur d'authentification: ${error}`)
            setTimeout(() => router.push('/'), 3000)
            return
        }

        if (token) {
            localStorage.setItem('token', token)
            // Store OAuth provider for Analyzer repo selection
            const provider = searchParams.get('provider')
            if (provider) {
                localStorage.setItem('oauth_provider', provider)
            }
            setStatus('success')
            toast.success('Connexion réussie!')
            router.push('/dashboard')
        } else {
            setStatus('error')
            toast.error('Token manquant')
            setTimeout(() => router.push('/'), 3000)
        }
    }, [searchParams, router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="text-center">
                {status === 'loading' && (
                    <>
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-white text-xl">Authentification en cours...</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <div className="text-green-500 text-6xl mb-4">✓</div>
                        <p className="text-white text-xl">Connexion réussie! Redirection...</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <div className="text-red-500 text-6xl mb-4">✗</div>
                        <p className="text-white text-xl">Erreur d'authentification. Redirection...</p>
                    </>
                )}
            </div>
        </div>
    )
}

export default function OAuthCallback() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            </div>
        }>
            <AuthContent />
        </Suspense>
    )
}
