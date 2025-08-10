"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Building2, Search } from 'lucide-react'
import axios from 'axios'

interface Department {
  id: number
  name: string
  department_number: string
  tenant_id: number
}

export default function DepartmentPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    department_number: ''
  })

  // Get tenant ID from session storage
  const [tenantID, setTenantID] = useState<string | null>(null)

  useEffect(() => {
    // Get tenant ID from session storage on client side
    const storedTenantID = sessionStorage.getItem('tenantID')
    setTenantID(storedTenantID)
  }, [])

  useEffect(() => {
    if (tenantID) {
      fetchDepartments()
    }
  }, [tenantID])

  const fetchDepartments = async () => {
    try {
      setLoading(true)
      console.log('Fetching departments with tenantID:', tenantID)
      console.log('API URL:', `${process.env.NEXT_PUBLIC_API_BASE_URL}/department`)
      
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/department`, {
        params: {
          tenant_id: tenantID,
          skip: 0,
          limit: 100
        }
      })
      
      console.log('API Response:', response.data)
      console.log('Response data type:', typeof response.data)
      console.log('Is response.data an array?', Array.isArray(response.data))
      console.log('Response data keys:', response.data ? Object.keys(response.data) : 'No data')
      
      // Handle different response structures
      let departmentsData = []
      if (response.data) {
        if (Array.isArray(response.data)) {
          console.log('Response is direct array')
          departmentsData = response.data
        } else if (response.data.departments && Array.isArray(response.data.departments)) {
          console.log('Response has departments array')
          departmentsData = response.data.departments
        } else if (response.data.data && Array.isArray(response.data.data)) {
          console.log('Response has data array')
          departmentsData = response.data.data
        } else if (response.data.items && Array.isArray(response.data.items)) {
          console.log('Response has items array')
          departmentsData = response.data.items
        } else if (response.data.results && Array.isArray(response.data.results)) {
          console.log('Response has results array')
          departmentsData = response.data.results
        } else {
          console.log('Unexpected response structure:', response.data)
          console.log('Response data structure:', JSON.stringify(response.data, null, 2))
          departmentsData = []
        }
      }
      
      console.log('Processed departments data:', departmentsData)
      setDepartments(departmentsData)
    } catch (error: any) {
      console.error('Error fetching departments:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      setDepartments([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingDepartment) {
        // Update existing department
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/department/${editingDepartment.id}`,
          {
            name: formData.name,
            department_number: formData.department_number,
            tenant_id: parseInt(tenantID || '0')
          }
        )
      } else {
        // Create new department
        await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/department`, {
          name: formData.name,
          department_number: formData.department_number,
          tenant_id: parseInt(tenantID || '0')
        })
      }
      
      // Reset form and close dialog
      setFormData({ name: '', department_number: '' })
      setEditingDepartment(null)
      setIsDialogOpen(false)
      
      // Refresh departments list
      fetchDepartments()
    } catch (error: any) {
      alert('Operation failed: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleEdit = (department: Department) => {
    setEditingDepartment(department)
    setFormData({
      name: department.name,
      department_number: department.department_number
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (departmentId: number) => {
    if (confirm('Are you sure you want to delete this department?')) {
      try {
        await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/department/${departmentId}`)
        fetchDepartments()
      } catch (error: any) {
        alert('Delete failed: ' + (error.response?.data?.message || error.message))
      }
    }
  }

  const openCreateDialog = () => {
    setEditingDepartment(null)
    setFormData({ name: '', department_number: '' })
    setIsDialogOpen(true)
  }

  const filteredDepartments = Array.isArray(departments) ? departments.filter(dept =>
    (dept.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (dept.department_number?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  ) : []

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading departments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-600" />
              Departments
            </h1>
            <p className="text-gray-600 mt-2">Manage your organization's departments</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Department
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingDepartment ? 'Edit Department' : 'Create New Department'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Department Name
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter department name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="department_number" className="block text-sm font-medium text-gray-700 mb-2">
                    Department Number
                  </label>
                  <Input
                    id="department_number"
                    type="text"
                    placeholder="Enter department number"
                    value={formData.department_number}
                    onChange={(e) => setFormData({ ...formData, department_number: e.target.value })}
                    required
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                    {editingDepartment ? 'Update' : 'Create'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Departments Grid */}
        {filteredDepartments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No departments found' : 'No departments yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'Get started by creating your first department'
                }
              </p>
              {!searchTerm && (
                <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Department
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDepartments.map((department) => (
              <Card key={department.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {department.name}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      #{department.department_number}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Department ID:</span>
                      <span className="font-medium">{department.id}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Tenant ID:</span>
                      <span className="font-medium">{department.tenant_id}</span>
                    </div>
                    
                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(department)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(department.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
