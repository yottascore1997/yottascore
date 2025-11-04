import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface JWTPayload {
  userId: string;
  role: string;
}

export async function signToken(payload: JWTPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePasswords(password: string, hashedPassword: string) {
  return bcrypt.compare(password, hashedPassword);
}

export async function validateUser(identifier: string, password: string) {
  // Determine if identifier looks like an email
  const isEmail = /.+@.+\..+/.test(identifier)

  const user = await prisma.user.findFirst({
    where: isEmail
      ? { email: identifier }
      : { username: identifier.toLowerCase() },
  })

  if (!user) {
    console.log('[AUTH] User not found:', identifier)
    return null
  }

  if (!user.hashedPassword) {
    console.log('[AUTH] User has no password hash:', user.id)
    return null
  }

  // Log for debugging (remove in production)
  console.log('[AUTH] Comparing password for user:', user.email || user.username)
  console.log('[AUTH] Hashed password exists:', !!user.hashedPassword)
  console.log('[AUTH] Hashed password length:', user.hashedPassword?.length)

  const isValid = await comparePasswords(password, user.hashedPassword)
  
  if (!isValid) {
    console.log('[AUTH] Password comparison failed for user:', user.email || user.username)
    return null
  }

  console.log('[AUTH] Password validated successfully for user:', user.email || user.username)
  return user
}

export async function getUserFromToken(token: string) {
  const payload = await verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId }
  });

  return user;
} 