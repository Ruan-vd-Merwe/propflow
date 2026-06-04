import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/service'

interface ArticleSummary {
  summary: string
  why_it_matters: string
  category: string
  relevance_score: number
  location_tags: string[]
}

function ruleBasedSummary(title: string, excerpt: string): ArticleSummary {
  const summary = excerpt ? excerpt.slice(0, 300).trim() + '.' : title
  return {
    summary,
    why_it_matters:
      'This development may affect property decisions for landlords and tenants in South Africa.',
    category: 'South African property news',
    relevance_score: 50,
    location_tags: [],
  }
}

export async function summarizeUnsummarized(
  limit = 20,
): Promise<{ summarized: number; errors: number }> {
  const supabase = createServiceClient()
  let summarized = 0
  let errors = 0

  const { data: articles } = await supabase
    .from('property_news_articles')
    .select('*')
    .is('summary', null)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (!articles?.length) return { summarized: 0, errors: 0 }

  const useAI = !!process.env.ANTHROPIC_API_KEY
  const client = useAI ? new Anthropic() : null

  for (const article of articles) {
    try {
      let result: ArticleSummary

      if (client) {
        const prompt = `You are a South African property market analyst.
Summarize this property news article for landlords, tenants and investors in South Africa.

Title: ${article.title}
Excerpt: ${article.raw_excerpt || 'No excerpt available'}
Source URL: ${article.url}

Respond ONLY with valid JSON in this exact format:
{
  "summary": "2-3 sentence summary of what happened",
  "why_it_matters": "1 sentence on who is affected and why",
  "category": "one of: Property prices | Rental market | Interest rates | New developments | Rezoning and planning | Cape Town property news | South African property news | Neighbourhood lifestyle | Investment insights | Tenant updates | Landlord updates | Other",
  "relevance_score": 0-100,
  "location_tags": ["array", "of", "SA", "locations", "mentioned"]
}`

        const message = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 400,
          messages: [{ role: 'user', content: prompt }],
        })

        const text = message.content[0].type === 'text' ? message.content[0].text : ''
        const clean = text.replace(/```json|```/g, '').trim()
        result = JSON.parse(clean) as ArticleSummary
      } else {
        result = ruleBasedSummary(article.title, article.raw_excerpt ?? '')
      }

      await supabase
        .from('property_news_articles')
        .update({
          summary:         result.summary,
          why_it_matters:  result.why_it_matters,
          category:        result.category,
          relevance_score: result.relevance_score,
          location_tags:   result.location_tags,
          updated_at:      new Date().toISOString(),
        })
        .eq('id', article.id)

      summarized++

      if (client) await new Promise(r => setTimeout(r, 1000))
    } catch (err) {
      console.error(`Failed to summarize article ${article.id}:`, err)
      errors++
    }
  }

  return { summarized, errors }
}
