import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = 'http://localhost:8080'

// Next.js 15: params is a Promise
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const authHeader = request.headers.get('authorization')

        if (!authHeader) {
            return NextResponse.json({ detail: 'Authorization header required' }, { status: 401 })
        }

        const resolvedParams = await params
        const pathSegments = resolvedParams.path
        const searchParams = request.nextUrl.searchParams

        // We expect at least owner/repo/action
        // e.g. ["owner", "repo", "contents"] or ["owner", "repo", "file", "stuff"]
        if (pathSegments.length < 3) {
            return NextResponse.json({ detail: 'Invalid path structure' }, { status: 400 })
        }

        const owner = pathSegments[0]
        const repo = pathSegments[1]
        const action = pathSegments[2] // 'contents' or 'file'

        let backendUrl: string

        if (action === 'contents') {
            const path = searchParams.get('path') || ''
            backendUrl = `${BACKEND_URL}/repos/${owner}/${repo}/contents?path=${encodeURIComponent(path)}`
        } else if (action === 'file') {
            const filePath = pathSegments.slice(3).join('/')
            backendUrl = `${BACKEND_URL}/repos/${owner}/${repo}/file/${filePath}`
        } else {
            return NextResponse.json({ detail: 'Invalid action' }, { status: 400 })
        }

        const response = await fetch(backendUrl, {
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
