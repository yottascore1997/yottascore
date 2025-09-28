'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FirebaseLogin from '@/components/FirebaseLogin';

export default function FirebaseLoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSuccess = (token: string, user: any) => {
    setLoading(true);
    
    // Store token in localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Redirect based on user role
    if (user.role === 'ADMIN') {
      router.push('/admin/dashboard');
    } else {
      router.push('/student/dashboard');
    }
  };

  const handleError = (error: string) => {
    console.error('Firebase login error:', error);
    alert('Login failed: ' + error);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-gray-900">
            YottaScore
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in with Firebase Authentication
          </p>
        </div>
        
        {loading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Signing you in...</p>
          </div>
        ) : (
          <FirebaseLogin onSuccess={handleSuccess} onError={handleError} />
        )}
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              Sign up here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
