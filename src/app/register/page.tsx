'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaEye, FaEyeSlash, FaGoogle, FaFacebook, FaApple, FaGift } from 'react-icons/fa';
import { MdSchool } from 'react-icons/md';

export default function RegisterPage() {
  const [step, setStep] = useState(1); // 1: phone, 2: otp, 3: details
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
    agreeToTerms: false
  });

  const handleSendOtp = () => {
    if (phoneNumber.length === 10) {
      setStep(2);
    }
  };

  const handleVerifyOtp = () => {
    if (otp.length === 6) {
      setStep(3);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRegister = () => {
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (!formData.agreeToTerms) {
      alert('Please agree to terms and conditions');
      return;
    }
    // Handle registration
    console.log('Registering user:', { phoneNumber, ...formData });
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

        {/* Register Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-10 border border-blue-200 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <MdSchool className="text-white text-3xl" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-3">Join EduBattle</h1>
            <p className="text-gray-600 text-lg">Start your learning journey today!</p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-10">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition duration-300 ${
                step >= 1 ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500'
              }`}>
                1
              </div>
              <div className={`w-16 h-1 mx-3 transition duration-300 ${step >= 2 ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gray-200'}`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition duration-300 ${
                step >= 2 ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500'
              }`}>
                2
              </div>
              <div className={`w-16 h-1 mx-3 transition duration-300 ${step >= 3 ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gray-200'}`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition duration-300 ${
                step >= 3 ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500'
              }`}>
                3
              </div>
            </div>
          </div>

          {/* Step 1: Phone Number */}
          {step === 1 && (
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
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
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
                onClick={() => setStep(1)}
                className="w-full text-gray-500 py-4 mt-4 hover:text-blue-600 transition duration-300"
              >
                Change Phone Number
              </button>
            </div>
          )}

          {/* Step 3: User Details */}
          {step === 3 && (
            <div>
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-3">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-4 rounded-xl bg-gray-100 text-gray-800 placeholder-gray-500 border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-3">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-4 rounded-xl bg-gray-100 text-gray-800 placeholder-gray-500 border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-3">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
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

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-3">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="w-full px-4 py-4 rounded-xl bg-gray-100 text-gray-800 placeholder-gray-500 border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 pr-12"
                    />
                    <button
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600"
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-3">
                    Referral Code (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter referral code"
                      value={formData.referralCode}
                      onChange={(e) => handleInputChange('referralCode', e.target.value)}
                      className="w-full px-4 py-4 rounded-xl bg-gray-100 text-gray-800 placeholder-gray-500 border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 pr-12"
                    />
                    <FaGift className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-500 text-lg" />
                  </div>
                  <p className="text-gray-500 text-xs mt-2">Get ₹100 bonus on successful referral</p>
                </div>

                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    id="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                    className="mt-1 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-blue-500/50"
                  />
                  <label htmlFor="agreeToTerms" className="text-gray-600 text-sm">
                    I agree to the{' '}
                    <Link href="/terms" className="text-blue-600 hover:text-blue-700 transition duration-300">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-700 transition duration-300">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
              </div>

              <button
                onClick={handleRegister}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition duration-300 mt-8 shadow-lg hover:shadow-blue-500/25"
              >
                Create Account
              </button>
            </div>
          )}

          {/* Login Link */}
          <div className="text-center mt-8">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold transition duration-300">
                Login Here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            By registering, you agree to our{' '}
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