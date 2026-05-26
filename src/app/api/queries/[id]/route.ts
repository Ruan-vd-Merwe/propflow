import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { QueryStatus } from '@/lib/types'

export const runtime = 'nodejs'

/**
 * PATCH /api/queries/:id — authenticated (landlord only)
 * Update query status and/or landlord notes.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const updates: Record<string, unknown> = {}

    if ('status' in body) {
      const valid: QueryStatus[] = ['open', 'in_progress', 'resolved']
      if (!valid.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      updates.status = body.status
    }
    if ('landlord_notes' in body) {
      updates.landlord_notes = body.landlord_notes
    }

    const { data, error } = await supabase
      .from('tenant_queries')
      .update(updates)
      .eq('id', params.id)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, query: data })
  } catch (err) {
    console.error('[queries PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
