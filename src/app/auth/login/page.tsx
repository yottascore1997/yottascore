'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import FirebaseLogin from '@/components/FirebaseLogin'

export default function Login() {
  const router = useRouter()
  const [redirectTo, setRedirectTo] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [firebaseProjectId, setFirebaseProjectId] = useState<string | null>(null)

  useEffect(() => {
    const redirect = new URLSearchParams(window.location.search).get('redirect')
    if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
      setRedirectTo(redirect)
    }

    fetch('/api/auth/firebase-config')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.projectId) setFirebaseProjectId(data.projectId)
      })
      .catch(() => {})
  }, [])

  const handleSuccess = (token: string, user: { role?: string }) => {
    localStorage.setItem('token', token)

    if (redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
      router.push(redirectTo)
      return
    }

    const role = user?.role
    if (String(role).toUpperCase() === 'ADMIN') {
      router.push('/admin/dashboard')
    } else {
      router.push('/student/dashboard')
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20" />
        <div className="animate-blob absolute top-0 -left-4 h-72 w-72 rounded-full bg-purple-300 opacity-70 mix-blend-multiply blur-xl filter" />
        <div className="animate-blob animation-delay-2000 absolute top-0 -right-4 h-72 w-72 rounded-full bg-yellow-300 opacity-70 mix-blend-multiply blur-xl filter" />
        <div className="animate-blob animation-delay-4000 absolute -bottom-8 left-20 h-72 w-72 rounded-full bg-pink-300 opacity-70 mix-blend-multiply blur-xl filter" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md px-6">
        <div className="space-y-8 rounded-3xl border border-white/20 bg-white/80 p-8 shadow-2xl backdrop-blur-xl">
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-3xl font-bold text-transparent">
                Welcome to Yottascore
              </h1>
              <p className="mt-2 text-gray-600">Apne mobile number se OTP login karein</p>
            </div>
          </div>

          {error && (
            <div className="animate-slide-in-right rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              <div className="flex items-start space-x-2">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          <FirebaseLogin onSuccess={handleSuccess} onError={setError} />

          <div className="text-center text-sm text-gray-500">
            <p>
              Naya account? OTP verify karte hi account ban jayega — alag register ki zaroorat nahi.
            </p>
            {firebaseProjectId && (
              <p className="mt-2 text-xs text-gray-400">
                Firebase project: <span className="font-mono">{firebaseProjectId}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 transform text-center text-sm text-gray-400">
        <p>© 2024 Yottascore. All rights reserved.</p>
      </div>
    </div>
  )
}
