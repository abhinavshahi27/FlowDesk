import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, email, role, created_at')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        createdAt: profile.created_at,
      },
    });
  } catch (error) {
    console.error('Me API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
