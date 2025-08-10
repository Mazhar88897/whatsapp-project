"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, X, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/login`, {
        email: email,
        password: password,
        tenant_secret_code: sessionStorage.getItem('tenantSecret')
      })
      // alert('Login successful!')
      sessionStorage.setItem('userLoginData', JSON.stringify(response.data))
      sessionStorage.setItem('userID', JSON.stringify(response.data.user.id))
      
      // Fetch user permissions
      try {
        const userID = sessionStorage.getItem('userID')
        const permissionsResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/permission/user/${userID}/permissions`
        )
        
        const permissionsData = permissionsResponse.data
        
        // Store user permissions
        sessionStorage.setItem('userPermissions', JSON.stringify(permissionsData.permissions || null))
        
        // Store admin permissions (from user_role if present)
        const adminPermissions = permissionsData.user_role?.permissions || null
        sessionStorage.setItem('adminPermissions', JSON.stringify(adminPermissions))
        
        // Store user role data
        sessionStorage.setItem('userRole', JSON.stringify(permissionsData.user_role || null))
        
        console.log('Permissions fetched and stored successfully')
      } catch (permissionError: any) {
        console.error('Failed to fetch permissions:', permissionError)
        // Store null values if permissions fetch fails
        sessionStorage.setItem('userPermissions', JSON.stringify(null))
        sessionStorage.setItem('adminPermissions', JSON.stringify(null))
        sessionStorage.setItem('userRole', JSON.stringify(null))
      }
      
      
      // You can handle storing tokens or redirecting here
    } catch (error: any) {
      alert('Login failed: ' + (error.response?.data?.message || error.message))

    } finally {
      // router.push('/flow/chats')
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Close button */}
       

        {/* Auth Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center mb-4">
              <MessageCircle className="w-7 h-6 text-white"  strokeWidth={2.5}/>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome to WhatsaApp CRM</h1>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <Link
            href="/auth/sign-in"
              onClick={() => setActiveTab('login')}
              className={`flex-1 text-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'login'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Log In
            </Link>
            <Link
            href="/auth/sign-up"
              onClick={() => setActiveTab('signup')}
              className={`flex-1 text-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'signup'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign Up
            </Link>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-medium py-3 rounded-md transition-all duration-200 transform hover:scale-[1.02]"
              onClick={() => router.push('/flow/chats')}
            >
              Log In
            </Button>

            {/* Forgot Password Link */}
            <div className="text-center">
              <Link
                href="/auth/forgot-password"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 