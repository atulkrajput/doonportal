import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, signToken, seedAdmin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Ensure default admin exists
    await seedAdmin();

    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.password))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = signToken({ id: user.id, name: user.name, email: user.email, role: user.role });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

    response.cookies.set('dp_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[API] POST /api/auth/login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
