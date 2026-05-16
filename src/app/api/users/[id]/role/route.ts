import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const headersList = await headers();
    const userId = headersList.get('x-user-id');
    const userRole = headersList.get('x-user-role');
    const { id } = await params;

    if (!userId || userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const { role } = await req.json();

    if (role !== 'ADMIN' && role !== 'MEMBER') {
        return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
    }

    // Prevent an admin from removing their own admin status if they are the only admin.
    if (role === 'MEMBER') {
        const targetUser = await prisma.user.findUnique({ where: { id } });
        if (targetUser?.id === userId) {
            const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
            if (adminCount <= 1) {
                return NextResponse.json({ error: 'Cannot remove the last admin.' }, { status: 400 });
            }
        }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true }
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Update Role API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
