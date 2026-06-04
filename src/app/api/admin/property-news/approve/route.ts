import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '../_auth'

export async function POST(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const { digestId } = await request.json()
  if (!digestId) return NextResponse.json({ error: 'digestId required' }, { status: 400 })

  const supabase = createClient()
  const { error: dbErr } = await supabase
    .from('property_news_digests')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', digestId)
    .eq('status', 'draft')

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
