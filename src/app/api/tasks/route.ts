import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const recent = searchParams.get('recent');
    
    const where: any = {};
    if (projectId) where.projectId = projectId;
    
    if (recent === 'true') {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      where.createdAt = { gte: threeDaysAgo };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({ tasks });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const userId = headersList.get('x-user-id');
    const userRole = headersList.get('x-user-role');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only admins can create tasks for now, or allow anyone? Let's allow admins to create tasks.
    if (userRole !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden. Admin access required to create tasks.' }, { status: 403 });
    }

    const { title, description, status, projectId, assigneeId, dueDate } = await req.json();

    if (!title || !projectId) {
      return NextResponse.json({ error: 'Title and projectId are required' }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        projectId,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
