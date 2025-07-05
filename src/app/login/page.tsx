'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaEye, FaEyeSlash, FaGoogle, FaFacebook, FaApple } from 'react-icons/fa';
import { MdSchool } from 'react-icons/md';

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState('phone'); // 'phone' or 'password'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSendOtp = () => {
    if (phoneNumber.length === 10) {
      setShowOtp(true);
    }
  };

  const handleVerifyOtp = () => {
    if (otp.length === 6) {
      // Handle OTP verification
      console.log('OTP verified');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link 
          href="/" 
          className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-8 transition duration-300 font-medium"
        >
          <FaArrowLeft className="mr-2" />
          Back to Home
        </Link>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-10 border border-blue-200 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <MdSchool className="text-white text-3xl" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-3">Welcome to EduBattle</h1>
            <p className="text-gray-600 text-lg">India's Premier Educational Gaming Platform</p>
          </div>

          {/* Login Method Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
            <button
              onClick={() => setLoginMethod('phone')}
              className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition duration-300 ${
                loginMethod === 'phone' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Phone Number
            </button>
            <button
              onClick={() => setLoginMethod('password')}
              className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition duration-300 ${
                loginMethod === 'password' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Email & Password
            </button>
          </div>

          {/* Phone Number Login */}
          {loginMethod === 'phone' && (
            <div>
              {!showOtp ? (
                <div>
                  <div className="mb-8">
                    <label className="block text-gray-700 text-sm font-semibold mb-3">
                      Phone Number
                    </label>
                    <div className="flex">
                      <div className="bg-gray-100 text-gray-700 px-4 py-4 rounded-l-xl border border-gray-300">
                        +91
                      </div>
                      <input
                        type="tel"
                        placeholder="Enter your phone number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        maxLength={10}
                        className="flex-1 px-4 py-4 rounded-r-xl bg-gray-100 text-gray-800 placeholder-gray-500 border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSendOtp}
                    disabled={phoneNumber.length !== 10}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/25"
                  >
                    Send OTP
                  </button>
                </div>
              ) : (
                <div>
                  <div className="mb-8">
                    <label className="block text-gray-700 text-sm font-semibold mb-3">
                      Enter OTP
                    </label>
                    <input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      className="w-full px-4 py-4 rounded-xl bg-gray-100 text-gray-800 placeholder-gray-500 border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                    />
                    <p className="text-gray-500 text-sm mt-3">
                      OTP sent to +91 {phoneNumber}
                    </p>
                  </div>
                  <button
                    onClick={handleVerifyOtp}
                    disabled={otp.length !== 6}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/25"
                  >
                    Verify OTP
                  </button>
                  <button
                    onClick={() => setShowOtp(false)}
                    className="w-full text-gray-500 py-4 mt-4 hover:text-blue-600 transition duration-300"
                  >
                    Change Phone Number
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Email & Password Login */}
          {loginMethod === 'password' && (
            <div>
              <div className="mb-8">
                <label className="block text-gray-700 text-sm font-semibold mb-3">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-4 rounded-xl bg-gray-100 text-gray-800 placeholder-gray-500 border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div className="mb-8">
                <label className="block text-gray-700 text-sm font-semibold mb-3">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-4 rounded-xl bg-gray-100 text-gray-800 placeholder-gray-500 border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 pr-12"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition duration-300 shadow-lg hover:shadow-blue-500/25">
                Login
              </button>
              <div className="text-center mt-6">
                <Link href="/forgot-password" className="text-gray-500 hover:text-blue-600 text-sm transition duration-300">
                  Forgot Password?
                </Link>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center my-8">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-6 text-gray-500 text-sm font-medium">OR</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Social Login */}
          <div className="space-y-4">
            <button className="w-full bg-white text-gray-800 py-4 rounded-xl font-semibold hover:bg-gray-50 transition duration-300 flex items-center justify-center shadow-lg hover:shadow-xl border border-gray-200">
              <FaGoogle className="mr-3 text-red-500 text-lg" />
              Continue with Google
            </button>
            <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition duration-300 flex items-center justify-center shadow-lg hover:shadow-xl">
              <FaFacebook className="mr-3 text-lg" />
              Continue with Facebook
            </button>
            <button className="w-full bg-black text-white py-4 rounded-xl font-semibold hover:bg-gray-800 transition duration-300 flex items-center justify-center shadow-lg hover:shadow-xl">
              <FaApple className="mr-3 text-lg" />
              Continue with Apple
            </button>
          </div>

          {/* Register Link */}
          <div className="text-center mt-8">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold transition duration-300">
                Register Now
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="text-blue-600 hover:text-blue-700 transition duration-300">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-700 transition duration-300">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 