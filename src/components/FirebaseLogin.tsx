'use client';

import { useState } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface FirebaseLoginProps {
  onSuccess: (token: string, user: { role?: string }) => void;
  onError: (error: string) => void;
}

function formatFirebaseError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: string }).code)
      : '';

  if (
    message.includes('BILLING_NOT_ENABLED') ||
    message.includes('billing-not-enabled') ||
    code.includes('billing-not-enabled')
  ) {
    return (
      'Firebase Phone OTP ke liye Blaze plan + billing chahiye. Firebase Console → Usage and billing → Blaze upgrade karein, ' +
      'aur billing usi project par ho jiska ID app me set hai. 15–30 min wait karke dubara try karein.'
    );
  }

  if (
    message.includes('INVALID_APP_CREDENTIAL') ||
    message.includes('invalid-app-credential') ||
    code.includes('invalid-app-credential')
  ) {
    return (
      'Firebase app credential invalid hai. Ye steps check karein: (1) Firebase → Authentication → Settings → Authorized domains me ' +
      'localhost aur apna live domain add ho. (2) GCP → APIs → Identity Toolkit API enabled ho. ' +
      '(3) API key par galat restrictions na hon. (4) .env me sahi NEXT_PUBLIC_FIREBASE_* values hon. Page refresh karke dubara try karein.'
    );
  }

  return message || 'Failed to send OTP';
}

async function createRecaptchaVerifier(): Promise<RecaptchaVerifier> {
  const container = document.getElementById('recaptcha-container');
  if (!container) {
    throw new Error('reCAPTCHA container missing. Please refresh the page.');
  }

  // Must not use display:none — Firebase rejects hidden reCAPTCHA containers
  container.innerHTML = '';

  const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible',
    callback: () => {},
    'expired-callback': () => {},
  });

  await verifier.render();
  return verifier;
}

export default function FirebaseLogin({ onSuccess, onError }: FirebaseLoginProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const { signInWithPhone, verifyOTP, error } = useFirebaseAuth();

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    onError('');

    let verifier: RecaptchaVerifier | null = null;

    try {
      const validationResponse = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      const validationData = await validationResponse.json();

      if (!validationResponse.ok || !validationData.success) {
        onError(validationData.error || 'Phone number validation failed');
        return;
      }

      verifier = await createRecaptchaVerifier();
      const formattedPhone = validationData.phoneNumber;
      const confirmationResult = await signInWithPhone(formattedPhone, verifier);

      setVerificationId(confirmationResult.verificationId);
      setShowOTP(true);
    } catch (err: unknown) {
      onError(formatFirebaseError(err));
    } finally {
      if (verifier) {
        try {
          verifier.clear();
        } catch {}
      }
      setSending(false);
    }
  };

  const handleOTPVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    onError('');

    try {
      const user = await verifyOTP(verificationId, otp);
      if (!user) return;

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
        onError(data.error || 'Login failed');
      }
    } catch (err: unknown) {
      onError(formatFirebaseError(err));
    } finally {
      setVerifying(false);
    }
  };

  const handleBack = () => {
    setShowOTP(false);
    setOtp('');
    setVerificationId('');
  };

  return (
    <div className="space-y-6">
      {!showOTP ? (
        <form onSubmit={handlePhoneLogin} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Mobile number
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 9876543210"
                required
                className="block w-full rounded-xl border border-gray-200 bg-white/50 py-3 pl-10 pr-3 text-gray-900 placeholder-gray-500 backdrop-blur-sm transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-xs text-gray-500">Country code ke saath number daalein (e.g. +91)</p>
          </div>

          <button
            type="submit"
            disabled={sending}
            className="flex w-full transform items-center justify-center rounded-xl border border-transparent bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-600 hover:to-purple-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? (
              <>
                <svg className="-ml-1 mr-3 h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Sending OTP...
              </>
            ) : (
              'Send OTP'
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleOTPVerification} className="space-y-5">
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            OTP sent to <span className="font-semibold">{phoneNumber}</span>
          </div>

          <div className="space-y-2">
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
              Enter OTP
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit code"
              maxLength={6}
              required
              className="block w-full rounded-xl border border-gray-200 bg-white/50 px-3 py-3 text-center text-lg tracking-[0.4em] text-gray-900 placeholder-gray-400 backdrop-blur-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 rounded-xl border border-gray-300 bg-white py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Change number
            </button>
            <button
              type="submit"
              disabled={verifying || otp.length < 6}
              className="flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 py-3 text-sm font-semibold text-white shadow-md transition hover:from-green-600 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {verifying ? 'Verifying...' : 'Verify & Login'}
            </button>
          </div>
        </form>
      )}

      {/* Off-screen, not display:none — required for Firebase reCAPTCHA */}
      <div
        id="recaptcha-container"
        className="pointer-events-none fixed -left-[9999px] top-0 h-px w-px overflow-hidden opacity-0"
        aria-hidden="true"
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
