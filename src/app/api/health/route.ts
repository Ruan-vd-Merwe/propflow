import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'MISSING',
    supabase_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? `set (${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length} chars)`
      : 'MISSING',
    resend_key: process.env.RESEND_API_KEY ? 'set' : 'MISSING',
    node_env: process.env.NODE_ENV,
  })
}
