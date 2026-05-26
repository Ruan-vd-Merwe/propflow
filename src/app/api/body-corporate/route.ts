import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { BodyCorpFlag as BodyCorpFlagType } from '@/lib/anthropic'

export const runtime = 'nodejs'

/** POST — save a parsed document + flags to DB */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const {
      property_id, title, source, filename, raw_text,
      meeting_date, claude_summary, flags,
    } = body as {
      property_id:   string
      title:         string
      source:        'pdf' | 'text_paste'
      filename?:     string
      raw_text:      string
      meeting_date:  string | null
      claude_summary: string
      flags:         BodyCorpFlagType[]
    }

    if (!property_id || !title || !flags) {
      return NextResponse.json({ error: 'property_id, title and flags are required' }, { status: 400 })
    }

    // Verify property ownership
    const { data: prop } = await supabase
      .from('properties').select('id').eq('id', property_id).eq('owner_id', user.id).single()
    if (!prop) return NextResponse.json({ error: 'Property not found' }, { status: 404 })

    // Count flags by severity
    const flagCount = { red: 0, amber: 0, green: 0 }
    for (const f of flags) flagCount[f.severity]++

    // Insert document
    const { data: doc, error: docError } = await supabase
      .from('body_corporate_documents')
      .insert({
        property_id, title, source,
        filename:     filename ?? null,
        raw_text:     raw_text ?? null,
        meeting_date: meeting_date ?? null,
        claude_summary,
        flag_count:   flagCount,
      })
      .select('id')
      .single()

    if (docError) return NextResponse.json({ error: docError.message }, { status: 500 })

    // Insert flags
    if (flags.length > 0) {
      const flagRows = flags.map((f) => ({
        document_id:          doc.id,
        property_id,
        category:             f.category,
        severity:             f.severity,
        title:                f.title,
        description:          f.description,
        amount_zar:           f.amount_zar,
        due_date:             f.due_date,
        requires_owner_action: f.requires_owner_action,
      }))

      const { error: flagError } = await supabase
        .from('body_corporate_flags').insert(flagRows)
      if (flagError) console.error('[body-corporate POST flags]', flagError)
    }

    return NextResponse.json({ success: true, id: doc.id }, { status: 201 })
  } catch (err) {
    console.error('[body-corporate POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** GET — list all documents for this landlord's properties */
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: props } = await supabase
    .from('properties').select('id').eq('owner_id', user.id)
  const ids = (props ?? []).map((p) => p.id)

  if (!ids.length) return NextResponse.json({ documents: [] })

  const { data } = await supabase
    .from('body_corporate_documents')
    .select('*')
    .in('property_id', ids)
    .order('created_at', { ascending: false })

  return NextResponse.json({ documents: data ?? [] })
}
