"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Database, KeyRound, RefreshCcw, CheckCircle2, Plus, Save, Trash2 } from 'lucide-react'

export default function VectorDatabaseConfigPage() {
  const [tenantId, setTenantId] = useState<number>(1)
  const [apiKey, setApiKey] = useState<string>('')
  const [status, setStatus] = useState<string>('unknown')
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    const storedTenant = sessionStorage.getItem('tenantID')
    if (storedTenant) {
      const id = Number(storedTenant)
      if (!Number.isNaN(id)) setTenantId(id)
    }
    refreshStatus()
  }, [])

  const refreshStatus = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pinecone-config/${tenantId}/status`)
      const data = await res.json()
      setStatus(data.status || 'unknown')
    } catch (e) {
      setStatus('unknown')
    }
  }

  const handleCreate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pinecone-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, api_key: apiKey }),
      })
      if (res.status === 409) {
        toast.warning('Configuration already exists. Use Update instead.')
      } else if (!res.ok) {
        const t = await res.text()
        throw new Error(t)
      } else {
        toast.success('Configuration created')
        setApiKey('')
        refreshStatus()
      }
    } catch (e: any) {
      toast.error('Create failed')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pinecone-config/${tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey }),
      })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t)
      }
      toast.success('Configuration updated')
      setApiKey('')
      refreshStatus()
    } catch (e: any) {
      toast.error('Update failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pinecone-config/${tenantId}`, { method: 'DELETE' })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t)
      }
      toast.success('Configuration deleted')
      setApiKey('')
      refreshStatus()
    } catch (e: any) {
      toast.error('Delete failed')
    } finally {
      setLoading(false)
    }
  }

  const handleValidate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pinecone-config/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey }),
      })
      if (!res.ok) throw new Error('Validation request failed')
      const data = await res.json()
      if (data.valid) toast.success('API key is valid')
      else toast.error('Invalid API key')
    } catch (e: any) {
      toast.error('Validation failed')
    } finally {
      setLoading(false)
    }
  }

  const StatusBadge = () => {
    const label = status === 'configured' ? 'Configured' : status === 'missing' ? 'Missing' : 'Unknown'
    const variant = status === 'configured' ? 'default' : status === 'missing' ? 'destructive' : 'secondary'
    return <Badge variant={variant as any}>{label}</Badge>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Database className="w-8 h-8 text-green-600" />
              Vector Database
            </h1>
            <p className="text-gray-600 mt-2">Configure your Pinecone credentials for this tenant.</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge />
            <Button variant="outline" onClick={refreshStatus} disabled={loading}>
              <RefreshCcw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Config Card */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-gray-700" />
              Pinecone API Key
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tenant ID</Label>
                <Input
                  type="number"
                  value={tenantId}
                  onChange={(e) => setTenantId(Number(e.target.value))}
                />
              </div>
              <div className="grid gap-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="pcn-..."
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button disabled={loading} onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Create
              </Button>
              <Button disabled={loading} onClick={handleUpdate} variant="secondary">
                <Save className="w-4 h-4 mr-2" />
                Update
              </Button>
              <Button disabled={loading} onClick={handleDelete} variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button disabled={loading || !apiKey} onClick={handleValidate} variant="outline">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Validate
              </Button>
            </div>

            <p className="text-xs text-gray-500">Your API key is stored securely and never displayed.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
