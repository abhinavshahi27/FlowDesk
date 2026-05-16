import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function PUT(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email } = await req.json();
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // If email is changing, update it in auth.users too. Supabase will send a
    // confirmation email if email confirmations are enabled in the dashboard.
    if (email !== user.email) {
      const { error: authError } = await supabase.auth.updateUser({ email });
      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ name, email })
      .eq('id', user.id)
      .select('id, name, email, role, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Email is already in use' }, { status: 400 });
      }
      console.error('Update Profile Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    return NextResponse.json({
      user: {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
