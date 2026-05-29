'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FaShieldAlt,
  FaArrowLeft,
  FaUserTimes,
  FaExclamationTriangle,
  FaCheckCircle,
  FaLock,
  FaEnvelope,
} from 'react-icons/fa';

export default function DeleteAccountPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'));
  }, []);

  const handleDeactivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (confirmText.trim().toUpperCase() !== 'DELETE') {
      setError('Please type DELETE to confirm.');
      return;
    }
    if (!agreed) {
      setError('Please confirm that you understand the consequences.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in. Please sign in and try again.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/deactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || data.message || 'Failed to delete account. Please try again.');
        return;
      }

      localStorage.removeItem('token');
      setSuccess(true);
      setTimeout(() => router.push('/'), 3000);
    } catch {
      setError('Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg blur-sm group-hover:blur-md transition-all" />
                <div className="relative w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-all duration-300 shadow-lg">
                  <FaShieldAlt className="text-white text-xl" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  YottaScore
                </h1>
                <p className="text-xs text-gray-600 font-semibold">Delete Account</p>
              </div>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transition-all duration-300"
            >
              <FaArrowLeft className="text-sm" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Home</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-full mb-6 shadow-xl">
            <FaUserTimes className="text-white text-3xl" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-800 mb-4">Delete Your Account</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Request permanent deactivation of your YottaScore account. This page is provided for Google Play,
            App Store, and privacy compliance.
          </p>
        </div>

        {success ? (
          <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-green-200 text-center">
            <FaCheckCircle className="text-green-600 text-5xl mx-auto mb-4" />
            <h2 className="text-2xl font-black text-gray-800 mb-2">Account Deactivated</h2>
            <p className="text-gray-700">
              Your account has been deactivated. You will be signed out and redirected to the home page shortly.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-6 mb-8 flex gap-4">
              <FaExclamationTriangle className="text-amber-600 text-2xl shrink-0 mt-1" />
              <div>
                <h2 className="text-lg font-black text-gray-800 mb-2">Before you continue</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
                  <li>Your account will be deactivated and you will not be able to sign in again.</li>
                  <li>Wallet balance, exam history, and social content may be retained for legal and audit purposes.</li>
                  <li>This action cannot be undone from the app. Contact support if you need help.</li>
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl mb-8 border-2 border-red-100">
              <h2 className="text-2xl font-black text-gray-800 mb-4">What gets removed or disabled</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-red-50 rounded-xl">
                  <h3 className="font-bold text-gray-800 mb-1">Immediately disabled</h3>
                  <p className="text-sm text-gray-700">Login access, active sessions, and app use with this account.</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl">
                  <h3 className="font-bold text-gray-800 mb-1">May be retained</h3>
                  <p className="text-sm text-gray-700">
                    Transaction records, KYC, and data required by law (tax, fraud prevention).
                  </p>
                </div>
              </div>
            </div>

            {isLoggedIn ? (
              <div className="bg-white rounded-3xl p-8 shadow-xl mb-8 border-2 border-purple-100">
                <div className="flex items-start gap-4 mb-6">
                  <FaLock className="text-purple-600 text-2xl mt-1" />
                  <div>
                    <h2 className="text-2xl font-black text-gray-800 mb-2">Confirm account deletion</h2>
                    <p className="text-gray-700 text-sm">
                      Enter your password and type <strong>DELETE</strong> to confirm.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleDeactivate} className="space-y-5 max-w-md">
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      placeholder="Your account password"
                      autoComplete="current-password"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirm" className="block text-sm font-semibold text-gray-700 mb-2">
                      Type DELETE to confirm
                    </label>
                    <input
                      id="confirm"
                      type="text"
                      required
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none uppercase"
                      placeholder="DELETE"
                    />
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700">
                      I understand that my account will be deactivated and I will lose access to YottaScore.
                    </span>
                  </label>

                  {error && (
                    <p className="text-sm text-red-600 font-medium bg-red-50 px-4 py-3 rounded-xl">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-6 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing…' : 'Delete my account'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 shadow-xl mb-8 border-2 border-blue-100 text-center">
                <FaLock className="text-blue-600 text-4xl mx-auto mb-4" />
                <h2 className="text-2xl font-black text-gray-800 mb-3">Sign in required</h2>
                <p className="text-gray-700 mb-6 max-w-md mx-auto">
                  To delete your account from this page, please sign in first. Then return here to complete
                  deletion.
                </p>
                <Link
                  href="/auth/login?redirect=/delete-account"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold hover:shadow-lg transition-all"
                >
                  Sign in to continue
                </Link>
              </div>
            )}

            <div className="bg-white rounded-3xl p-8 shadow-xl mb-8 border-2 border-indigo-100">
              <div className="flex items-start gap-4">
                <FaEnvelope className="text-indigo-600 text-2xl mt-1" />
                <div>
                  <h2 className="text-2xl font-black text-gray-800 mb-3">Cannot sign in or use password?</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    If you signed up with a method that does not use a password, or you cannot access your account,
                    email us to request deletion:
                  </p>
                  <p>
                    <a
                      href="mailto:privacy@yottascore.com?subject=Account%20Deletion%20Request"
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      privacy@yottascore.com
                    </a>
                  </p>
                  <p className="text-sm text-gray-600 mt-4">
                    Include your registered email or phone number. We will verify your identity and process your
                    request within 30 days.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="text-center mt-12">
          <Link
            href="/privacy"
            className="text-blue-600 font-semibold hover:underline mr-6"
          >
            Privacy Policy
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold text-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            <FaArrowLeft />
            Back to Home
          </Link>
        </div>
      </div>

      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 mb-2">&copy; {new Date().getFullYear()} YottaScore. All rights reserved.</p>
          <div className="flex justify-center gap-6 text-sm flex-wrap">
            <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/delete-account" className="text-gray-400 hover:text-white transition-colors">
              Delete Account
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/student/support" className="text-gray-400 hover:text-white transition-colors">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
