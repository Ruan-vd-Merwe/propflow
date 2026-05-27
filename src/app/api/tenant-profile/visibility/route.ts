import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// POST /api/tenant-profile/visibility — toggle is_visible
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  const body = await req.formData()
  const isVisible = body.get('is_visible') === 'true'

  await supabase
    .from('tenant_profiles')
    .update({ is_visible: isVisible, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  // Redirect back to the profile page
  return NextResponse.redirect(new URL('/tenant/profile', req.url))
}
