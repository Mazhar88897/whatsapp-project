import { NextRequest, NextResponse } from 'next/server'

// POST /api/pinecone-config/validate
// Validates a Pinecone API key by attempting to list indexes
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { api_key } = body || {}
    if (!api_key) {
      return NextResponse.json({ message: 'api_key is required' }, { status: 400 })
    }

    // Pinecone REST requires Api-Key and version header
    const response = await fetch('https://api.pinecone.io/indexes', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': api_key,
        'X-Pinecone-API-Version': '2025-01',
      },
    })

    if (response.status === 401 || response.status === 403) {
      return NextResponse.json({ valid: false }, { status: 200 })
    }

    if (!response.ok) {
      // For other errors, consider key invalid but include reason
      const text = await response.text()
      return NextResponse.json({ valid: false, reason: text }, { status: 200 })
    }

    return NextResponse.json({ valid: true }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ message: 'Validation error', error: String(error?.message || error) }, { status: 500 })
  }
}
