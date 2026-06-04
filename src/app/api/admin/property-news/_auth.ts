import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function requireAdmin(): Promise<
  { user: { id: string }; error: null } |
  { user: null; error: NextResponse }
> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: prof } = await supabase
    .from('profiles')
    .select('is_landlord, email')
    .eq('id', user.id)
    .single()

  const adminEmail = process.env.ADMIN_TEST_EMAIL
  const isAdmin = prof?.is_landlord || (adminEmail && prof?.email === adminEmail)

  if (!isAdmin) {
    return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { user, error: null }
}
