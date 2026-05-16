import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  project_id: string;
  assignee_id: string | null;
  created_at: string;
  updated_at: string;
  project: { id: string; name: string } | null;
  assignee: { id: string; name: string } | null;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const recent = searchParams.get('recent');

    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from('tasks')
      .select(
        'id, title, description, status, due_date, project_id, assignee_id, created_at, updated_at, project:projects!project_id(id, name), assignee:profiles!assignee_id(id, name)'
      )
      .order('created_at', { ascending: false });

    if (projectId) query = query.eq('project_id', projectId);

    if (recent === 'true') {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      query = query.gte('created_at', threeDaysAgo.toISOString());
    }

    const { data, error } = await query.returns<TaskRow[]>();

    if (error) {
      console.error('List Tasks Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    const tasks = (data ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      dueDate: t.due_date,
      projectId: t.project_id,
      assigneeId: t.assignee_id,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      project: t.project,
      assignee: t.assignee,
    }));

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('List Tasks Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, status, projectId, assigneeId, dueDate } = await req.json();
    if (!title || !projectId) {
      return NextResponse.json({ error: 'Title and projectId are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title,
        description,
        status: status || 'TODO',
        project_id: projectId,
        assignee_id: assigneeId || null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '42501' || error.message.toLowerCase().includes('row-level security')) {
        return NextResponse.json(
          { error: 'Forbidden. Admin access required to create tasks.' },
          { status: 403 }
        );
      }
      console.error('Create Task Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    return NextResponse.json({ task: data }, { status: 201 });
  } catch (error) {
    console.error('Create Task Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
