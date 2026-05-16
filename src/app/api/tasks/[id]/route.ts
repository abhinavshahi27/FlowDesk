import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, title, description, assigneeId, dueDate } = await req.json();

    const { data: existing } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (status !== undefined) updates.status = status;
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (assigneeId !== undefined) updates.assignee_id = assigneeId;
    if (dueDate !== undefined) updates.due_date = dueDate ? new Date(dueDate).toISOString() : null;

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '42501' || error.message.toLowerCase().includes('row-level security')) {
        return NextResponse.json(
          { error: 'Forbidden. Members can only update task status on tasks assigned to them.' },
          { status: 403 }
        );
      }
      console.error('Update Task Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    return NextResponse.json({ task: data });
  } catch (error) {
    console.error('Update Task Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase.from('tasks').delete().eq('id', id);

    if (error) {
      if (error.code === '42501' || error.message.toLowerCase().includes('row-level security')) {
        return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
      }
      console.error('Delete Task Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete Task Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
