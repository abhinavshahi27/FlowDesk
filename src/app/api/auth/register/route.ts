import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message || 'Registration failed' },
        { status: 400 }
      );
    }

    // If email confirmation is required, Supabase returns user but no session.
    if (!data.session) {
      return NextResponse.json({
        user: { id: data.user.id, name, email, role: 'MEMBER' },
        needsEmailConfirmation: true,
      });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, email, role')
      .eq('id', data.user.id)
      .single();

    return NextResponse.json({ user: profile });
  } catch (error) {
    console.error('Register API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
