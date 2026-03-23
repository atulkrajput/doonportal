import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret';
const TOKEN_NAME = 'dp_admin_token';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function seedAdmin() {
  const existing = await prisma.user.findUnique({ where: { email: 'admin@doonportal.com' } });
  if (!existing) {
    await prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@doonportal.com',
        password: await hashPassword('admin123'),
        role: 'admin',
      },
    });
    console.log('[Auth] Default admin created: admin@doonportal.com / admin123');
  }
}
