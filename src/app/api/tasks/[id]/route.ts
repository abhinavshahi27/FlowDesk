import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const headersList = await headers();
    const userId = headersList.get('x-user-id');
    const userRole = headersList.get('x-user-role');
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, title, description, assigneeId, dueDate } = await req.json();

    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Admins can update anything. Members can only update status if they are assigned to it (or if we want a simpler rule, members can just update status).
    if (userRole !== 'ADMIN') {
        // Members can only update status
        if (title || description || assigneeId || dueDate) {
            return NextResponse.json({ error: 'Forbidden. Members can only update task status.' }, { status: 403 });
        }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(userRole === 'ADMIN' && {
            ...(title && { title }),
            ...(description && { description }),
            ...(assigneeId !== undefined && { assigneeId }),
            ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null })
        })
      },
    });

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
      const headersList = await headers();
      const userId = headersList.get('x-user-id');
      const userRole = headersList.get('x-user-role');
      const { id } = await params;
  
      if (!userId || userRole !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
      }
  
      await prisma.task.delete({ where: { id } });
  
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
