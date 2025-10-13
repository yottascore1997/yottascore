import { useState, useEffect } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  signInWithPhoneNumber, 
  signOut, 
  onAuthStateChanged,
  RecaptchaVerifier,
  PhoneAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export const useFirebaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const signInWithPhone = async (phoneNumber: string, appVerifier: RecaptchaVerifier) => {
    try {
      setError(null);
      console.log('📱 Attempting to send OTP to:', phoneNumber);
      
      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      
      console.log('✅ OTP sent successfully! Verification ID:', result.verificationId);
      return result;
    } catch (error: any) {
      console.error('❌ Phone sign-in error:', error);
      setError(error.message);
      throw error;
    }
  };

  const verifyOTP = async (verificationId: string, otp: string) => {
    try {
      setError(null);
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      const result = await signInWithCredential(auth, credential);
      return result.user;
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  return {
    user,
    loading,
    error,
    signInWithEmail,
    signInWithPhone,
    verifyOTP,
    logout
  };
};
