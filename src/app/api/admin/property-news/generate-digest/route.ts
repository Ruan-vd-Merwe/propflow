import { NextResponse } from 'next/server'
import { requireAdmin } from '../_auth'
import { generateWeeklyDigest } from '@/lib/news/digest-generator'

export async function POST() {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const result = await generateWeeklyDigest()
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
