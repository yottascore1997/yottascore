import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';   // 15 min
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';
const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export interface JWTPayload {
  userId: string;
  role: string;
  type?: 'access' | 'refresh';
}

/** Legacy: long-lived token (7d). Prefer signAccessToken + refresh. */
export async function signToken(payload: JWTPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function signAccessToken(payload: Omit<JWTPayload, 'type'>) {
  return jwt.sign({ ...payload, type: 'access' }, JWT_SECRET, { expiresIn: ACCESS_EXPIRY });
}

export async function signRefreshToken(payload: Omit<JWTPayload, 'type'>) {
  return jwt.sign({ ...payload, type: 'refresh' }, JWT_SECRET, { expiresIn: REFRESH_EXPIRY });
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Use for protected routes: accepts access token only, rejects refresh. */
export async function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    if (decoded.type === 'refresh') return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function verifyAccessToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    if (decoded.type === 'refresh') return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<JWTPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    if (decoded.type !== 'refresh') return null;
    const tokenHash = hashRefreshToken(token);
    const stored = await prisma.refreshToken.findFirst({
      where: { userId: decoded.userId, tokenHash, expiresAt: { gt: new Date() } },
    });
    if (!stored) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePasswords(password: string, hashedPassword: string) {
  return bcrypt.compare(password, hashedPassword);
}

export async function findUserForLogin(identifier: string) {
  const isEmail = /.+@.+\..+/.test(identifier);
  return prisma.user.findFirst({
    where: isEmail
      ? { email: identifier.trim().toLowerCase() }
      : { username: identifier.trim().toLowerCase() },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      role: true,
      hashedPassword: true,
      failedLoginAttempts: true,
      lockedUntil: true,
    },
  });
}

export async function validateUser(identifier: string, password: string) {
  const user = await findUserForLogin(identifier);

  if (!user) return null;
  if (!user.hashedPassword) return null;

  const now = new Date();
  if (user.lockedUntil && user.lockedUntil > now) {
    return null; // Locked
  }

  const isValid = await comparePasswords(password, user.hashedPassword);

  if (!isValid) {
    const attempts = (user.failedLoginAttempts ?? 0) + 1;
    const lockedUntil = attempts >= LOCKOUT_ATTEMPTS
      ? new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000)
      : null;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil,
      },
    });
    return null;
  }

  // Success: reset lockout
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  return user;
}

export async function getUserFromToken(token: string) {
  const payload = await verifyToken(token);
  if (!payload) return null;
  return prisma.user.findUnique({
    where: { id: payload.userId },
  });
}

/** Strong password: min 8 chars, at least one letter and one number */
export function validatePasswordStrength(password: string): { ok: boolean; message?: string } {
  if (password.length < 8) {
    return { ok: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { ok: false, message: 'Password must contain at least one letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { ok: false, message: 'Password must contain at least one number' };
  }
  return { ok: true };
}
