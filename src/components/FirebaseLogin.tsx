'use client';

import { useState, useEffect } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface FirebaseLoginProps {
  onSuccess: (token: string, user: any) => void;
  onError: (error: string) => void;
}

export default function FirebaseLogin({ onSuccess, onError }: FirebaseLoginProps) {
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  const { signInWithEmail, signInWithPhone, verifyOTP, error } = useFirebaseAuth();

  useEffect(() => {
    // Initialize reCAPTCHA verifier
    if (typeof window !== 'undefined') {
      try {
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA solved');
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
          }
        });
        setRecaptchaVerifier(verifier);
      } catch (error) {
        console.error('reCAPTCHA initialization error:', error);
        // Create a fallback verifier
        const fallbackVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'normal',
          callback: () => {
            console.log('reCAPTCHA solved (fallback)');
          }
        });
        setRecaptchaVerifier(fallbackVerifier);
      }
    }
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await signInWithEmail(email, password);
      if (user) {
        // Get ID token and send to your backend
        const idToken = await user.getIdToken();
        const response = await fetch('/api/auth/firebase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
        
        const data = await response.json();
        if (response.ok) {
          onSuccess(data.token, data.user);
        } else {
          onError(data.error);
        }
      }
    } catch (error: any) {
      onError(error.message);
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!recaptchaVerifier) {
        onError('reCAPTCHA not initialized');
        return;
      }

      const confirmationResult = await signInWithPhone(phoneNumber, recaptchaVerifier);
      setVerificationId(confirmationResult.verificationId);
      setShowOTP(true);
    } catch (error: any) {
      onError(error.message);
    }
  };

  const handleOTPVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await verifyOTP(verificationId, otp);
      if (user) {
        const idToken = await user.getIdToken();
        const response = await fetch('/api/auth/firebase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
        
        const data = await response.json();
        if (response.ok) {
          onSuccess(data.token, data.user);
        } else {
          onError(data.error);
        }
      }
    } catch (error: any) {
      onError(error.message);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Firebase Login</h2>
      
      {/* Login Method Toggle */}
      <div className="flex mb-6">
        <button
          onClick={() => setLoginMethod('email')}
          className={`flex-1 py-2 px-4 rounded-l-md ${
            loginMethod === 'email' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Email
        </button>
        <button
          onClick={() => setLoginMethod('phone')}
          className={`flex-1 py-2 px-4 rounded-r-md ${
            loginMethod === 'phone' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Phone
        </button>
      </div>

      {/* Email Login Form */}
      {loginMethod === 'email' && (
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Login with Email
          </button>
        </form>
      )}

      {/* Phone Login Form */}
      {loginMethod === 'phone' && !showOTP && (
        <form onSubmit={handlePhoneLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+919876543210"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Send OTP
          </button>
        </form>
      )}

      {/* OTP Verification Form */}
      {loginMethod === 'phone' && showOTP && (
        <form onSubmit={handleOTPVerification} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Enter OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Verify OTP
          </button>
        </form>
      )}

      {/* reCAPTCHA Container - Hidden but required for Firebase */}
      <div id="recaptcha-container" style={{ display: 'none' }}></div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
