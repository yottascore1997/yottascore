'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, signInWithPhoneNumber, RecaptchaVerifier, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';

export default function FirebaseTestPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [result, setResult] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setResult(`Email login successful: ${userCredential.user.uid}`);
    } catch (error: any) {
      setResult(`Email login error: ${error.message}`);
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setResult('Sending OTP...');
      
      // Create reCAPTCHA verifier
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
          setResult('reCAPTCHA expired. Please try again.');
        }
      });

      // Send OTP
      const confirmationResult = await signInWithPhoneNumber(auth, phone, recaptchaVerifier);
      setVerificationId(confirmationResult.verificationId);
      setShowOTP(true);
      setResult(`✅ OTP sent successfully to ${phone}! Check your phone for SMS.`);
    } catch (error: any) {
      console.error('Phone login error:', error);
      setResult(`❌ Phone login error: ${error.message}`);
    }
  };

  const handleOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setResult('Verifying OTP...');
      
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      const userCredential = await signInWithCredential(auth, credential);
      
      // Get ID token for our backend
      const idToken = await userCredential.user.getIdToken();
      
      // Test API first
      console.log('🧪 Testing Firebase API...');
      const testResponse = await fetch('/api/auth/firebase-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, phoneNumber: userCredential.user.phoneNumber }),
      });
      
      if (!testResponse.ok) {
        const testError = await testResponse.json();
        setResult(`❌ Test API error: ${testError.error}`);
        return;
      }
      
      const testData = await testResponse.json();
      console.log('✅ Test API response:', testData);
      
      // Now try the real Firebase API
      const response = await fetch('/api/auth/firebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult(`🎉 Login successful! Welcome ${data.user.name || data.user.phoneNumber}!`);
        setShowOTP(false);
        setOtp('');
        setPhone('');
        
        // Store token for app use (same as existing login)
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        console.log('✅ Firebase login successful:', data.user);
        
        // Redirect to dashboard (same as existing login)
        const role = data.user?.role || data.role;
        if (String(role).toUpperCase() === 'ADMIN') {
          window.location.href = '/admin/dashboard';
        } else {
          window.location.href = '/student/dashboard';
        }
      } else {
        const errorData = await response.json();
        setResult(`❌ Backend error: ${errorData.error}`);
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      setResult(`❌ OTP verification error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Firebase Authentication Test</h1>
        
        {/* Email Login */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Email Login Test</h2>
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600"
            >
              Login with Email
            </button>
          </form>
        </div>

        {/* Phone Login */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">📱 Phone OTP Login Test</h2>
          {!showOTP ? (
            <form onSubmit={handlePhoneLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+919876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +91 for India)</p>
              </div>
              <button
                type="submit"
                className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition-colors"
              >
                📤 Send OTP
              </button>
            </form>
          ) : (
            <form onSubmit={handleOTPVerify} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                <input
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-center text-lg tracking-widest"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Check your phone for SMS</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-purple-500 text-white p-3 rounded-lg hover:bg-purple-600 transition-colors"
                >
                  ✅ Verify OTP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowOTP(false);
                    setOtp('');
                    setResult('');
                  }}
                  className="px-4 bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  ↩️ Back
                </button>
              </div>
            </form>
          )}
        </div>

        {/* reCAPTCHA Container */}
        <div id="recaptcha-container" style={{ display: 'none' }}></div>

        {/* Result */}
        {result && (
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Result:</h3>
            <p className="text-sm">{result}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 p-6 rounded-lg mt-6">
          <h3 className="font-semibold mb-2">📋 OTP Login Instructions:</h3>
          <ul className="text-sm space-y-2">
            <li>• <strong>Phone Format:</strong> Use +91XXXXXXXXXX (with country code)</li>
            <li>• <strong>Real Number:</strong> Use your actual phone number for testing</li>
            <li>• <strong>SMS Delivery:</strong> Check your phone for OTP after clicking "Send OTP"</li>
            <li>• <strong>OTP Format:</strong> Usually 6 digits (e.g., 123456)</li>
            <li>• <strong>Firebase Setup:</strong> Make sure Authentication is enabled in Firebase Console</li>
            <li>• <strong>reCAPTCHA:</strong> May appear automatically for verification</li>
          </ul>
          
          <div className="mt-4 p-3 bg-red-100 border border-red-400 rounded">
            <p className="text-sm text-red-800">
              <strong>❌ Configuration Error?</strong> If you get "CONFIGURATION_NOT_FOUND" error, 
              <a href="/firebase-error" className="text-blue-600 hover:underline ml-1">
                click here to fix it
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
