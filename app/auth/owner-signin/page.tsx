"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function OwnerSignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log(process.env.NEXT_PUBLIC_API_BASE_URL)
    
    // Get tenant secret code from session storage
    const tenantSecretCode = sessionStorage.getItem('tenantSecret')
    
    if (!tenantSecretCode) {
      console.error('Tenant secret code not found in session')
      return
    }
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
          name: name,
          tenant_secret_code: tenantSecretCode,
          role_id: 1, // Hardcoded role_id
          department_id: 1 // Hardcoded department_id
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
       const data = await response.json()
       console.log('User signup successful!')
       sessionStorage.setItem('ownerData', JSON.stringify(data))
       sessionStorage.setItem('roleID', data.role_id)
       sessionStorage.setItem('departmentID', data.department_id)
      
     

      // Redirect to sign-up page
      router.push('/auth/sign-up')
    } catch (error: any) {
      console.log(error)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center mb-4">
              <MessageCircle className="w-7 h-6 text-white" strokeWidth={2.5}/>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Owner Signup</h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full"
                required
              />
            </div>
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

            {/* Signup Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-medium py-3 rounded-md transition-all duration-200 transform hover:scale-[1.02]"
            >
              Sign Up
            </Button>
            {/* Login Link */}
            <div className="text-center">
              <Link
                href="/auth/sign-in"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
              >
                Already have an account? Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
