import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = 'http://localhost:8080'

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader) return NextResponse.json({ detail: 'Token missing' }, { status: 401 })

        console.log(`[Proxy] Fetching: ${BACKEND_URL}/repos/`)

        // Appel au Gateway
        const response = await fetch(`${BACKEND_URL}/repos/`, {
            headers: { 'Authorization': authHeader },
        })

        // On lit le texte d'abord pour éviter le crash JSON si c'est du HTML
        const textData = await response.text()
        console.log(`[Proxy] Status: ${response.status}`)
        console.log(`[Proxy] Body: ${textData.substring(0, 200)}...`) // Affiche le début de la réponse

        if (!response.ok) {
            return NextResponse.json({
                detail: `Backend Error ${response.status}`,
                body: textData
            }, { status: response.status })
        }

        // Si tout va bien, on parse le JSON
        const data = JSON.parse(textData)
        return NextResponse.json(data, { status: 200 })

    } catch (error) {
        console.error('Proxy error detailed:', error)
        return NextResponse.json({ detail: 'Proxy connection failed' }, { status: 500 })
    }
}