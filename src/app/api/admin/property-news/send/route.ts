import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '../_auth'
import { sendDigestToSubscribers } from '@/lib/news/digest-sender'

export async function POST(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const { digestId } = await request.json()
  if (!digestId) return NextResponse.json({ error: 'digestId required' }, { status: 400 })

  const supabase = createClient()
  const { data: digest } = await supabase
    .from('property_news_digests')
    .select('status')
    .eq('id', digestId)
    .single()

  if (!digest) return NextResponse.json({ error: 'Digest not found' }, { status: 404 })
  if (digest.status !== 'approved') {
    return NextResponse.json({ error: 'Digest must be approved before sending' }, { status: 400 })
  }

  try {
    const result = await sendDigestToSubscribers(digestId)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
