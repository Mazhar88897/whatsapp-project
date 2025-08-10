import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import PineconeConfig from '@/models/PineconeConfig'

// GET /api/pinecone-config/{tenant_id}/status
export async function GET(_req: NextRequest, { params }: { params: { tenant_id: string } }) {
  try {
    await dbConnect()
    const tenantId = Number(params.tenant_id)
    if (Number.isNaN(tenantId)) {
      return NextResponse.json({ message: 'tenant_id must be a number' }, { status: 400 })
    }
    const config = await PineconeConfig.findOne({ tenant_id: tenantId }).lean()
    if (!config) return NextResponse.json({ status: 'missing' })
    return NextResponse.json({ status: config.api_key ? 'configured' : 'missing' })
  } catch (error: any) {
    return NextResponse.json({ message: 'Failed to fetch status', error: String(error?.message || error) }, { status: 500 })
  }
}
