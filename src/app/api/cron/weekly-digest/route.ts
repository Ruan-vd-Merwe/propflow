import { NextResponse } from 'next/server'
import { fetchAllSources } from '@/lib/news/fetcher'
import { summarizeUnsummarized } from '@/lib/news/summarizer'
import { generateWeeklyDigest } from '@/lib/news/digest-generator'
import { sendDigestToSubscribers } from '@/lib/news/digest-sender'
import { createServiceClient } from '@/lib/supabase/service'

export const runtime    = 'nodejs'
export const maxDuration = 300

export async function GET(request: Request) {
  const auth = request.headers.get('Authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const fetchResult     = await fetchAllSources()
    const summarizeResult = await summarizeUnsummarized(30)
    const digestResult    = await generateWeeklyDigest()

    const supabase = createServiceClient()
    let sendResult = { sent: 0, failed: 0 }

    if (
      digestResult.articlesCount >= 5 &&
      process.env.NEWS_DIGEST_SEND_ENABLED === 'true'
    ) {
      await supabase
        .from('property_news_digests')
        .update({ status: 'approved' })
        .eq('id', digestResult.digestId)

      sendResult = await sendDigestToSubscribers(digestResult.digestId)
    }

    return NextResponse.json({
      success:   true,
      fetch:     fetchResult,
      summarize: summarizeResult,
      digest:    digestResult,
      send:      sendResult,
    })
  } catch (err) {
    console.error('Weekly digest cron failed:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
