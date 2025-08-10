import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import PineconeConfig from '@/models/PineconeConfig'

// POST /api/pinecone-config
export async function POST(req: NextRequest) {
  try {
    await dbConnect()
    const body = await req.json()
    const { tenant_id, api_key } = body || {}

    if (typeof tenant_id !== 'number' || !api_key) {
      return NextResponse.json({ message: 'tenant_id (number) and api_key are required' }, { status: 400 })
    }

    const existing = await PineconeConfig.findOne({ tenant_id })
    if (existing) {
      return NextResponse.json({ message: 'Config already exists for tenant' }, { status: 409 })
    }

    const created = await PineconeConfig.create({ tenant_id, api_key })
    return NextResponse.json(
      { id: created._id.toString(), tenant_id: created.tenant_id, createdAt: created.createdAt },
      { status: 201 }
    )
  } catch (error: any) {
    return NextResponse.json({ message: 'Failed to create config', error: String(error?.message || error) }, { status: 500 })
  }
}
