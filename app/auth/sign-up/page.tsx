"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OtpInput } from '@/components/ui/otp-input'
import { TenantSecretModal } from '@/components/ui/tenant-secret-modal'
import { Eye, EyeOff, MessageCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [tenantSecretCode, setTenantSecretCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // OTP states
  const [showOtpForm, setShowOtpForm] = useState(false)
  const [otp, setOtp] = useState('')
  const [isOtpLoading, setIsOtpLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Tenant modal states
  const [showTenantModal, setShowTenantModal] = useState(false)
  const [tenantData, setTenantData] = useState<any>(null)

  // Password validation states
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  })

  // Password strength checker
  const checkPasswordStrength = (password: string) => {
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
    })
  }

  // Check if password is strong
  const isPasswordStrong = () => {
    return Object.values(passwordStrength).every(Boolean)
  }

  // Check if passwords match
  const doPasswordsMatch = () => {
    return password === confirmPassword && password.length > 0
  }

  // Update password and check strength
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    checkPasswordStrength(newPassword)
  }

  // Update confirm password
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value)
  }

  //   const handleSubmit = async (e: React.FormEvent) => {
  //     e.preventDefault()
  //     setIsLoading(true)
  //     setError('')
      
  //     try {
  //       const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/login`, {
  //         email: email,
  //         password: password,
  //         tenant_secret_code: tenantSecretCode
  //       })

  //       // Store user data in session storage
  //       sessionStorage.setItem('userLoginData', JSON.stringify(response.data))
  //       sessionStorage.setItem('userID', JSON.stringify(response.data.user.id))
        
  //       // Fetch user permissions
  //       try {
  //         const userID = sessionStorage.getItem('userID')
  //         const permissionsResponse = await axios.get(
  //           `${process.env.NEXT_PUBLIC_API_BASE_URL}/permission/user/${userID}/permissions`
  //         )
        
  //         const permissionsData = permissionsResponse.data
        
  //         // Store user permissions
  //         sessionStorage.setItem('userPermissions', JSON.stringify(permissionsData.permissions || null))
        
  //         // Store admin permissions (from user_role if present)
  //         const adminPermissions = permissionsData.user_role?.permissions || null
  //         sessionStorage.setItem('adminPermissions', JSON.stringify(adminPermissions))
        
  //         // Store user role data
  //         sessionStorage.setItem('userRole', JSON.stringify(permissionsData.user_role || null))
        
  //         console.log('Permissions fetched and stored successfully')
  //       } catch (permissionError: any) {
  //         console.error('Failed to fetch permissions:', permissionError)
  //         // Store null values if permissions fetch fails
  //         sessionStorage.setItem('userPermissions', JSON.stringify(null))
  //         sessionStorage.setItem('adminPermissions', JSON.stringify(null))
  //         sessionStorage.setItem('userRole', JSON.stringify(null))
  //       }

  //       if (response.status === 200) {
  //         router.push('/flow/chats')
  //       }
        
  //     } catch (error: any) {
  //       setError(error.response?.data?.message || error.message || 'Login failed. Please try again.')
  //     } finally {
  //       setIsLoading(false)
  //     }
  //   }

  // New OTP-based authentication flow
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all required fields
    if (!fullName) {
      toast.error('Please enter your full name')
      return
    }
    
    if (!email) {
      toast.error('Please enter your email address')
      return
    }
    
    if (!password) {
      toast.error('Please enter your password')
      return
    }

    if (!confirmPassword) {
      toast.error('Please confirm your password')
      return
    }

    if (!doPasswordsMatch()) {
      toast.error('Passwords do not match')
      return
    }

    if (!isPasswordStrong()) {
      toast.error('Password does not meet strength requirements')
      return
    }
    
    if (!tenantSecretCode) {
      toast.error('Please enter your tenant secret code')
      return
    }

    setIsOtpLoading(true)
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/send-otp`, {
        email: email
      })
      
      toast.success('OTP sent successfully! Check your email')
      
      // After successful OTP send, create tenant
      try {
        const tenantResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tenant/`, {
          name: fullName,
          email: email,
          max_team_member_allowed: 5,
          max_conversations_allowed: 30,
          max_outgoing_messages_per_day: 800
        })
        
        // Store tenant data in session storage
        if (tenantResponse.data && tenantResponse.data.id) {
          sessionStorage.setItem('tenantID', tenantResponse.data.id)
          sessionStorage.setItem('tenantData', JSON.stringify(tenantResponse.data))
          
          // Store tenant secret code for the user
          sessionStorage.setItem('tenantSecret', tenantResponse.data.tenant_secret_code)
          
          // Show tenant modal with secret code
          setTenantData(tenantResponse.data)
          setShowTenantModal(true)
          
          toast.success('Tenant created successfully!')
        }
        
      } catch (tenantError: any) {
        console.error('Failed to create tenant:', tenantError)
        // Don't show error to user as OTP was sent successfully
        // Tenant creation failure won't block the sign-up process
      }
      
      setShowOtpForm(true)
      setOtpSent(true)
      startCountdown()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP')
    } finally {
      setIsOtpLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }

    setIsOtpLoading(true)
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/verify-otp`, {
        email: email,
        otp: otp
      })
      
      toast.success('OTP verified successfully!')
      
      // Now proceed with the actual sign-up
      try {
        const signupResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/signup`, {
          email: email,
          password: password,
          name: fullName,
          tenant_secret_code: tenantSecretCode,
          role_id: sessionStorage.getItem('roleID'),
          department_id: sessionStorage.getItem('departmentID')
        })

        toast.success('Account created successfully!')
        
        // Don't redirect immediately - let the modal handle it
        // The modal will redirect to login after user copies the secret and closes it
        
      } catch (signupError: any) {
        toast.error('Sign up failed after OTP verification: ' + (signupError.response?.data?.message || signupError.message))
        // Reset OTP form to allow retry
        setOtp('')
      }
      
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid OTP')
      setOtp('')
    } finally {
      setIsOtpLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (countdown > 0) return
    
    setIsOtpLoading(true)
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/resend-otp`, {
        email: email
      })
      
      toast.success('OTP resent successfully!')
      
      // After successful resend, create tenant
      try {
        const tenantResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tenant/`, {
          name: fullName,
          email: email,
          max_team_member_allowed: 5,
          max_conversations_allowed: 30,
          max_outgoing_messages_per_day: 800
        })
        
        // Store tenant data in session storage
        if (tenantResponse.data && tenantResponse.data.id) {
          sessionStorage.setItem('tenantID', tenantResponse.data.id)
          sessionStorage.setItem('tenantData', JSON.stringify(tenantResponse.data))
          
          // Store tenant secret code for the user
          sessionStorage.setItem('tenantSecret', tenantResponse.data.tenant_secret_code)
          
          // Show tenant modal with secret code
          setTenantData(tenantResponse.data)
          setShowTenantModal(true)
          
          toast.success('Tenant created successfully!')
        }
        
      } catch (tenantError: any) {
        console.error('Failed to create tenant:', tenantError)
        // Don't show error to user as OTP was sent successfully
        // Tenant creation failure won't block the sign-up process
      }
      
      startCountdown()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP')
    } finally {
      setIsOtpLoading(false)
    }
  }

  const startCountdown = () => {
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleBackToLogin = () => {
    setShowOtpForm(false)
    setOtp('')
    setOtpSent(false)
    setCountdown(0)
  }

  const handleTenantModalClose = () => {
    setShowTenantModal(false)
    setTenantData(null)
    // Clear form data
    setFullName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setTenantSecretCode('')
    setShowOtpForm(false)
    setOtp('')
    setOtpSent(false)
    setCountdown(0)
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Auth Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center mb-4">
              <MessageCircle className="w-7 h-6 text-white" strokeWidth={2.5}/>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome to WhatsaApp CRM</h1>
            <p className="text-gray-600 text-sm mt-2">
              {showOtpForm ? 'Enter OTP to continue' : 'Sign in to your account'}
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <Link
              href="/auth/sign-in"
              className="flex-1 text-center py-2 px-4 rounded-md text-sm font-medium text-gray-900 shadow-sm"
            >
              Log In
            </Link>
            <Link
              href="/auth/sign-up"
              className="flex-1 text-center py-2 px-4 rounded-md text-sm font-medium  bg-white  transition-colors"
            >
              Sign Up
            </Link>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-medium p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          {/* OTP Form */}
          {showOtpForm ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">
                  We've sent a 6-digit OTP to <span className="font-medium text-gray-900">{email}</span>
                </p>
              </div>

              {/* OTP Input */}
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP
                </label>
                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  length={6}
                  disabled={isOtpLoading}
                  className="mb-4"
                />
                <p className="text-xs text-gray-500 text-center">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              {/* Verify OTP Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-medium py-3 rounded-md transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={isOtpLoading}
              >
                {isOtpLoading ? 'Verifying...' : 'Verify OTP'}
              </Button>

              {/* Resend OTP */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={countdown > 0 || isOtpLoading}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
                >
                  <RefreshCw className={`w-4 h-4 ${isOtpLoading ? 'animate-spin' : ''}`} />
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                </button>
                {countdown > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    You can request a new code in {countdown} seconds
                  </div>
                )}
              </div>

              {/* Back to Login */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="text-gray-600 hover:text-gray-700 text-sm font-medium transition-colors"
                >
                  ← Back to Login
                </button>
              </div>
            </form>
          ) : (
            /* Regular Sign Up Form */
            <form onSubmit={handleSendOtp} className="space-y-4">
              {/* Full Name Field */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full"
                  required
                  disabled={isOtpLoading}
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
                  disabled={isOtpLoading}
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
                    onChange={handlePasswordChange}
                    className="w-full pr-10"
                    required
                    disabled={isOtpLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    disabled={isOtpLoading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    className="w-full pr-10"
                    required
                    disabled={isOtpLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    disabled={isOtpLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Passwords must match.
                    <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 8 characters long, contain uppercase, lowercase, number, and special character.
                </p>
          
                </p>
               
              </div>

              {/* Tenant Secret Code Field */}
           

              {/* Send OTP Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-medium py-3 rounded-md transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={isOtpLoading}
              >
                {isOtpLoading ? 'Sending OTP...' : 'Send OTP'}
              </Button>

              {/* Forgot Password Link */}
             

              {/* Sign Up Link */}
              <div className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  href="/auth/sign-in"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Login Here
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
      
      {/* Tenant Secret Modal */}
      <TenantSecretModal
        isOpen={showTenantModal}
        onClose={handleTenantModalClose}
        tenantSecret={tenantData?.tenant_secret_code || ''}
        tenantName={tenantData?.name || ''}
      />
    </div>
  )
}
