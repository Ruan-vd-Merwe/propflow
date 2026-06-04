import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/service'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendDigestToSubscribers(
  digestId: string,
): Promise<{ sent: number; failed: number }> {
  const supabase = createServiceClient()
  let sent = 0
  let failed = 0

  const { data: digest } = await supabase
    .from('property_news_digests')
    .select('*')
    .eq('id', digestId)
    .single()

  if (!digest) throw new Error('Digest not found')
  if (digest.status === 'sent') throw new Error('Digest already sent')

  const { data: subscribers } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .eq('is_subscribed', true)

  if (!subscribers?.length) {
    console.log('No subscribers to send to')
    return { sent: 0, failed: 0 }
  }

  const batchSize = 10
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize)

    for (const subscriber of batch) {
      try {
        const html = (digest.html_content as string).replace(
          '{{unsubscribe_token}}',
          subscriber.unsubscribe_token,
        )

        const { error } = await resend.emails.send({
          from:    'PropTrust Weekly <newsletter@proptrust.co.za>',
          to:      subscriber.email,
          subject: digest.subject as string,
          html,
          text:    digest.text_content as string,
        })

        if (error) throw new Error(error.message)

        await supabase.from('property_news_send_log').insert({
          digest_id:     digestId,
          subscriber_id: subscriber.id,
          status:        'sent',
        })

        sent++
      } catch (err) {
        await supabase.from('property_news_send_log').insert({
          digest_id:     digestId,
          subscriber_id: subscriber.id,
          status:        'failed',
          error_message: String(err),
        })
        failed++
      }
    }

    if (i + batchSize < subscribers.length) {
      await new Promise(r => setTimeout(r, 2000))
    }
  }

  await supabase
    .from('property_news_digests')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', digestId)

  return { sent, failed }
}

export async function sendTestDigest(digestId: string, testEmail: string): Promise<void> {
  const supabase = createServiceClient()

  const { data: digest } = await supabase
    .from('property_news_digests')
    .select('*')
    .eq('id', digestId)
    .single()

  if (!digest) throw new Error('Digest not found')

  const html = (digest.html_content as string).replace('{{unsubscribe_token}}', 'test-token')

  const { error } = await resend.emails.send({
    from:    'PropTrust Weekly <newsletter@proptrust.co.za>',
    to:      testEmail,
    subject: '[TEST] ' + (digest.subject as string),
    html,
    text:    digest.text_content as string,
  })

  if (error) throw new Error(error.message)
}
