import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = 'http://localhost:8080'

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')

        if (!authHeader) {
            return NextResponse.json({ detail: 'Authorization header required' }, { status: 401 })
        }

        const response = await fetch(`${BACKEND_URL}/auth/me`, {
            headers: {
                'Authorization': authHeader,
            },
        })

        const data = await response.json()

        return NextResponse.json(data, { status: response.status })
    } catch (error) {
        console.error('Proxy error:', error)
        return NextResponse.json({ detail: 'Proxy error' }, { status: 500 })
    }
}
