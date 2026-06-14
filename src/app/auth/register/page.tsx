'use client'

import Link from 'next/link'

export default function Register() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-purple-100 to-blue-100">
          <svg className="h-10 w-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h1 className="mb-3 text-2xl font-bold text-gray-900">Create account with phone</h1>
        <p className="mb-6 text-gray-600">
          Yottascore me account banane ke liye apna mobile number use karein. OTP verify hote hi aapka account
          automatically create ho jayega.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex w-full items-center justify-center rounded-xl border border-transparent bg-gradient-to-r from-purple-600 to-blue-600 py-3 px-4 text-sm font-semibold text-white transition-all duration-200 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          Continue with OTP login
        </Link>
      </div>
    </div>
  )
}
