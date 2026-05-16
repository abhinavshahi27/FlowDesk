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

    const { role } = await req.json();
    if (role !== 'ADMIN' && role !== 'MEMBER') {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
    }

    // Prevent the only admin from demoting themselves.
    if (role === 'MEMBER' && id === user.id) {
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'ADMIN');

      if ((count ?? 0) <= 1) {
        return NextResponse.json({ error: 'Cannot remove the last admin.' }, { status: 400 });
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id)
      .select('id, name, email, role')
      .single();

    if (error) {
      if (error.code === '42501' || error.message.toLowerCase().includes('row-level security')) {
        return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
      }
      console.error('Update Role API Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error('Update Role API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
