import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import PineconeConfig from '@/models/PineconeConfig'

// GET /api/pinecone-config/{tenant_id}
export async function GET(_req: NextRequest, { params }: { params: { tenant_id: string } }) {
  try {
    await dbConnect()
    const tenantId = Number(params.tenant_id)
    if (Number.isNaN(tenantId)) {
      return NextResponse.json({ message: 'tenant_id must be a number' }, { status: 400 })
    }
    const config = await PineconeConfig.findOne({ tenant_id: tenantId }).lean()
    if (!config) return NextResponse.json({ message: 'Not found' }, { status: 404 })
    return NextResponse.json({ tenant_id: config.tenant_id, has_api_key: Boolean(config.api_key) })
  } catch (error: any) {
    return NextResponse.json({ message: 'Failed to fetch config', error: String(error?.message || error) }, { status: 500 })
  }
}

// PUT /api/pinecone-config/{tenant_id}
export async function PUT(req: NextRequest, { params }: { params: { tenant_id: string } }) {
  try {
    await dbConnect()
    const tenantId = Number(params.tenant_id)
    if (Number.isNaN(tenantId)) {
      return NextResponse.json({ message: 'tenant_id must be a number' }, { status: 400 })
    }
    const body = await req.json()
    const { api_key } = body || {}
    if (!api_key) return NextResponse.json({ message: 'api_key is required' }, { status: 400 })
    const updated = await PineconeConfig.findOneAndUpdate(
      { tenant_id: tenantId },
      { api_key },
      { new: true, upsert: false }
    )
    if (!updated) return NextResponse.json({ message: 'Not found' }, { status: 404 })
    return NextResponse.json({ tenant_id: updated.tenant_id, updatedAt: updated.updatedAt })
  } catch (error: any) {
    return NextResponse.json({ message: 'Failed to update config', error: String(error?.message || error) }, { status: 500 })
  }
}

// DELETE /api/pinecone-config/{tenant_id}
export async function DELETE(_req: NextRequest, { params }: { params: { tenant_id: string } }) {
  try {
    await dbConnect()
    const tenantId = Number(params.tenant_id)
    if (Number.isNaN(tenantId)) {
      return NextResponse.json({ message: 'tenant_id must be a number' }, { status: 400 })
    }
    const res = await PineconeConfig.findOneAndDelete({ tenant_id: tenantId })
    if (!res) return NextResponse.json({ message: 'Not found' }, { status: 404 })
    return NextResponse.json({ message: 'Deleted' })
  } catch (error: any) {
    return NextResponse.json({ message: 'Failed to delete config', error: String(error?.message || error) }, { status: 500 })
  }
}
