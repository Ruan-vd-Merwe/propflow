import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const supabase = createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(new URL('/login?error=expired', request.url))
    }
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Create tenant_profiles row on first confirmation (data was stored in metadata at signup)
    if (user.user_metadata?.user_type === 'tenant') {
      const { data: existing } = await supabase
        .from('tenant_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!existing) {
        const m = user.user_metadata
        await supabase.from('tenant_profiles').insert({
          user_id:              user.id,
          sa_id_number:         m.sa_id_number ?? null,
          current_area:         m.current_area ?? null,
          current_province:     m.current_province ?? null,
          looking_in_area:      m.looking_in_area ?? null,
          looking_in_province:  m.looking_in_province ?? null,
          budget_min:           m.budget_min ?? null,
          budget_max:           m.budget_max ?? null,
          move_in_date:         m.move_in_date ?? null,
          lease_length_months:  m.lease_length_months ?? null,
          employment_status:    m.employment_status ?? null,
          monthly_income:       m.monthly_income ?? null,
          is_visible:           true,
          whatsapp_opted_in:    m.whatsapp_opted_in ?? true,
        })
      }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profile?.user_type === 'tenant') {
      return NextResponse.redirect(new URL('/tenant/profile', request.url))
    }
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  return NextResponse.redirect(new URL('/login', request.url))
}
