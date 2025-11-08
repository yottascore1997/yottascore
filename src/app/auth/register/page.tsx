'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    username: '',
    password: '',
    phoneNumber: '',
    referralCode: '',
    role: 'STUDENT',
  })
  const [error, setError] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<{state: 'idle'|'checking'|'available'|'unavailable'|'invalid', message?: string}>({ state: 'idle' })

  // Get referral code from URL parameter
  useEffect(() => {
    const refCode = searchParams.get('ref')
    if (refCode) {
      setFormData(prev => ({ ...prev, referralCode: refCode }))
    }
  }, [searchParams])

  // Debounced username availability check
  useEffect(() => {
    const username = formData.username.trim().toLowerCase()
    if (!username) { 
      setUsernameStatus({ state: 'idle' }); 
      return 
    }

    const usernameRegex = /^[a-z0-9_\.]{3,20}$/
    if (!usernameRegex.test(username)) {
      setUsernameStatus({ state: 'invalid', message: 'Use 3-20 chars: a-z, 0-9, _ or .' })
      return
    }
    
    setUsernameStatus({ state: 'checking' })
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`)
        const data = await res.json()
        setUsernameStatus({ 
          state: data.available ? 'available' : 'unavailable', 
          message: data.available ? 'Username available' : 'Username not available' 
        })
      } catch (e) {
        setUsernameStatus({ state: 'invalid', message: 'Could not verify username' })
      }
    }, 400)
    return () => clearTimeout(t)
  }, [formData.username])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        // Store the token
        localStorage.setItem('token', data.token)
        // Redirect to student dashboard
        router.push('/student/dashboard')
      } else {
        setError(data.message || 'Registration failed')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join ExamIndia and start your exam preparation journey
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className={`appearance-none relative block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 sm:text-sm ${
                  usernameStatus.state === 'unavailable' || usernameStatus.state === 'invalid' 
                    ? 'border-red-400 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                }`}
                placeholder="Choose a unique username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
              />
              <p className="mt-1 text-xs text-gray-500">You can login using your username or email.</p>
              {usernameStatus.state !== 'idle' && (
                <p className={`mt-1 text-xs ${
                  usernameStatus.state === 'available' ? 'text-green-600' 
                  : usernameStatus.state === 'checking' ? 'text-gray-500' 
                  : 'text-red-600'
                }`}>
                  {usernameStatus.state === 'checking' ? 'Checking availability...' : usernameStatus.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="Enter your phone number"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-1">Select Role</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { value: 'STUDENT', title: 'Student', description: 'Practice exams, analytics, and rewards.' },
                  { value: 'ADMIN', title: 'Admin', description: 'Manage exams, learners, and content.' },
                ].map((option) => {
                  const isSelected = formData.role === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: option.value })}
                      className={`rounded-lg border p-3 text-left transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50 shadow-md shadow-purple-200'
                          : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50'
                      }`}
                    >
                      <p className={`text-sm font-semibold ${isSelected ? 'text-purple-700' : 'text-gray-700'}`}>
                        {option.title}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">{option.description}</p>
                    </button>
                  )
                })}
              </div>
              <p className="mt-1 text-xs text-gray-500">Select the access level you need for this account.</p>
            </div>
            <div>
              <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700 mb-1">
                Referral Code (Optional)
              </label>
              <input
                id="referralCode"
                name="referralCode"
                type="text"
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="Enter friend's referral code"
                value={formData.referralCode}
                onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
              />
              <p className="mt-1 text-xs text-gray-500">
                Use a friend's referral code to help them earn ₹100
              </p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
            >
              Create Account
            </button>
          </div>
        </form>
        <div className="text-center">
          <Link href="/auth/login" className="text-purple-600 hover:text-purple-700 font-medium">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function Register() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterForm />
    </Suspense>
  )
} 