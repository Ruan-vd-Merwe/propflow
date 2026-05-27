import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import type { QueryCategory } from '@/lib/types'

export const runtime = 'nodejs'

/**
 * POST /api/queries — public (token-based)
 * Tenant submits a new query using their access_token for identity verification.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, category, subcategory, title, description } = body as {
      token:        string
      category:     QueryCategory
      subcategory?: string
      title:        string
      description:  string
    }

    if (!token || !category || !title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'token, category, title and description are required' }, { status: 400 })
    }

    const validCategories: QueryCategory[] = ['emergency', 'maintenance', 'general']
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Verify token → get tenant (accept both portal_token UUID and legacy access_token)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)
    const tokenCol = isUuid ? 'portal_token' : 'access_token'

    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, full_name, email')
      .eq(tokenCol, token)
      .single()

    if (!tenant) {
      return NextResponse.json({ error: 'Invalid access token' }, { status: 401 })
    }

    const { data: query, error } = await supabase
      .from('tenant_queries')
      .insert({
        tenant_id:   tenant.id,
        category,
        subcategory: subcategory ?? null,
        title:       title.trim(),
        description: description.trim(),
        status:      'open',
      })
      .select('id, status, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, query }, { status: 201 })
  } catch (err) {
    console.error('[queries POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/queries?token=... — public (token-based)
 * Returns the tenant's own queries.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) {
    // Authenticated landlord view — fall through to RLS
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Landlord: get all queries for their tenants
    const { data: queries } = await supabase
      .from('tenant_queries')
      .select('*, tenants!inner(full_name, email, properties!inner(name))')
      .order('created_at', { ascending: false })

    return NextResponse.json({ queries: queries ?? [] })
  }

  // Token-based tenant access
  const supabase = createServiceClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('access_token', token)
    .single()

  if (!tenant) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const { data: queries } = await supabase
    .from('tenant_queries')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ queries: queries ?? [] })
}
