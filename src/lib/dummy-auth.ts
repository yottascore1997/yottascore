import { formatToE164 } from '@/lib/phone-validation';

export const DUMMY_PHONE = '+919420413822';
export const DUMMY_OTP = '123456';
export const DUMMY_UID = 'dummy_919420413822';

export function isDummyLoginEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.ENABLE_DUMMY_LOGIN === 'true';
}

export function isDummyPhoneNumber(phoneNumber: string): boolean {
  try {
    return formatToE164(phoneNumber) === DUMMY_PHONE;
  } catch {
    return false;
  }
}

export function verifyDummyOTP(otp: string): boolean {
  return otp.trim() === DUMMY_OTP;
}
