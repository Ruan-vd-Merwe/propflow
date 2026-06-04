import { NextResponse } from 'next/server'
import { requireAdmin } from '../_auth'
import { fetchAllSources } from '@/lib/news/fetcher'
import { summarizeUnsummarized } from '@/lib/news/summarizer'

export async function POST() {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const fetchResult     = await fetchAllSources()
    const summarizeResult = await summarizeUnsummarized(20)

    return NextResponse.json({
      fetched:    fetchResult.fetched,
      stored:     fetchResult.stored,
      summarized: summarizeResult.summarized,
      errors:     fetchResult.errors,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
