import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
  owner: { id: string; name: string } | null;
  tasks: { count: number }[];
};

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('projects')
      .select('id, name, description, owner_id, created_at, updated_at, owner:profiles!owner_id(id, name), tasks(count)')
      .order('created_at', { ascending: false })
      .returns<ProjectRow[]>();

    if (error) {
      console.error('List Projects Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    const projects = (data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      ownerId: p.owner_id,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      owner: p.owner,
      _count: { tasks: p.tasks?.[0]?.count ?? 0 },
    }));

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('List Projects Error:', error);
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

    const { name, description } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({ name, description, owner_id: user.id })
      .select('id, name, description, owner_id, created_at, updated_at')
      .single();

    if (error) {
      // RLS blocks non-admins -> 403
      if (error.code === '42501' || error.message.toLowerCase().includes('row-level security')) {
        return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
      }
      console.error('Create Project Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    return NextResponse.json({ project: data }, { status: 201 });
  } catch (error) {
    console.error('Create Project Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
