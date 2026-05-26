import Anthropic from '@anthropic-ai/sdk'

// ─── Client ───────────────────────────────────────────────────────────────────

let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        'ANTHROPIC_API_KEY is not set. Add it to .env.local ' +
        '(get it from console.anthropic.com → API Keys).'
      )
    }
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _client
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type BodyCorpCategory =
  | 'special_levy'
  | 'maintenance'
  | 'legal'
  | 'financial'
  | 'action_required'

export type FlagSeverity = 'red' | 'amber' | 'green'

export interface BodyCorpFlag {
  category:           BodyCorpCategory
  severity:           FlagSeverity
  title:              string
  description:        string
  amount_zar:         number | null
  due_date:           string | null   // YYYY-MM-DD
  requires_owner_action: boolean
}

export interface BodyCorpAnalysis {
  meeting_date: string | null   // YYYY-MM-DD
  summary:      string
  flags:        BodyCorpFlag[]
}

// ─── System prompts (cached) ──────────────────────────────────────────────────

const BODY_CORP_SYSTEM = `\
You are a South African property management expert who analyses body corporate meeting minutes.
Your job is to extract ALL notable items and categorise them for a property owner (landlord).

Return ONLY a valid JSON object — no markdown, no explanation. Schema:
{
  "meeting_date": "YYYY-MM-DD or null",
  "summary": "2-3 sentence executive summary of the meeting",
  "flags": [
    {
      "category": "special_levy | maintenance | legal | financial | action_required",
      "severity": "red | amber | green",
      "title": "Short title (max 10 words)",
      "description": "Detailed description of the item and its implications for the owner",
      "amount_zar": null or a number (rand amount, no currency symbol),
      "due_date": "YYYY-MM-DD or null",
      "requires_owner_action": true or false
    }
  ]
}

Severity rules:
  red    — Urgent or high financial risk: large levies, legal action, structural damage, overdue items
  amber  — Needs attention within ~3 months: upcoming levies, planned maintenance, financial warnings
  green  — Informational: routine items, minor updates, positive news

Category rules:
  special_levy      — Any additional levy beyond normal monthly levy
  maintenance       — Building repairs, painting, roofing, plumbing, lifts, etc.
  legal             — Disputes, defaulting owners, attorneys, court actions
  financial         — Reserve fund, arrears, budget, audit findings
  action_required   — Items that explicitly require the owner to do something (vote, pay, attend)

If no flags of a certain severity exist, do not include empty entries.
Extract EVERY relevant item — err on the side of inclusion.`

const JOB_DESC_SYSTEM = `\
You are a professional property maintenance coordinator in South Africa.
Generate clear, professional job description letters to send to maintenance contractors.
The letter should be formal but friendly, specific about scope, and request a written quote.
Return ONLY the job description text — no JSON, no markdown headers. Plain text, 150-250 words.`

// ─── 1. Body Corporate Minutes Parser ────────────────────────────────────────

export async function parseBodyCorpMinutes(text: string): Promise<BodyCorpAnalysis> {
  const client = getClient()

  // Truncate to ~80K chars to stay within context limits
  const truncated = text.slice(0, 80_000)
  const wasTruncated = text.length > 80_000

  const response = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 4096,
    system: [
      {
        type:          'text',
        text:          BODY_CORP_SYSTEM,
        cache_control: { type: 'ephemeral' },  // cache the system prompt
      },
    ],
    messages: [
      {
        role: 'user',
        content:
          (wasTruncated ? '[Note: document was truncated to fit context window]\n\n' : '') +
          'Parse these body corporate meeting minutes:\n\n' +
          truncated,
      },
      // Prefill forces valid JSON output
      { role: 'assistant', content: '{' },
    ],
  })

  const raw = '{' + (response.content[0] as { text: string }).text
  const parsed: BodyCorpAnalysis = JSON.parse(raw)

  // Normalise: ensure flags is always an array
  if (!Array.isArray(parsed.flags)) parsed.flags = []

  return parsed
}

// ─── 2. Maintenance Job Description Generator ─────────────────────────────────

export async function generateJobDescription(opts: {
  componentType:    string
  componentName:    string
  propertyName:     string
  propertyAddress:  string
  issueDescription: string
  urgency:          'urgent' | 'normal' | 'planned'
  installedDate?:   string
  ageYears?:        number
  landlordName:     string
  landlordEmail:    string
  landlordPhone?:   string | null
}): Promise<string> {
  const client = getClient()

  const urgencyStr =
    opts.urgency === 'urgent'  ? 'URGENT — requires attention within 48 hours' :
    opts.urgency === 'normal'  ? 'Standard — requires attention within 2 weeks' :
                                 'Planned — schedule at mutual convenience'

  const componentAge = opts.ageYears != null
    ? ` (installed ${opts.installedDate ?? 'unknown date'}, approximately ${Math.round(opts.ageYears)} years old)`
    : ''

  const prompt = `\
Generate a professional maintenance job description / enquiry letter for the following:

PROPERTY: ${opts.propertyName}
ADDRESS:  ${opts.propertyAddress}
COMPONENT: ${opts.componentName} — ${opts.componentType}${componentAge}
URGENCY:   ${urgencyStr}
ISSUE:     ${opts.issueDescription}

LANDLORD CONTACT:
  Name:  ${opts.landlordName}
  Email: ${opts.landlordEmail}
  ${opts.landlordPhone ? `Phone: ${opts.landlordPhone}` : ''}

Include: scope of work, access arrangements note, request for written quote within 7 days.
Use South African English. Do not include a date line — the landlord will add it.`

  const response = await client.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: [
      {
        type:          'text',
        text:          JOB_DESC_SYSTEM,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: prompt }],
  })

  return (response.content[0] as { text: string }).text.trim()
}

// ─── 3. Contractor Quote Summariser ──────────────────────────────────────────

export async function summariseQuote(opts: {
  quoteText:    string
  jobTitle:     string
  propertyName: string
}): Promise<string> {
  const client = getClient()

  const prompt = `\
Summarise this contractor quote for the landlord of ${opts.propertyName}.
Job: ${opts.jobTitle}

Quote / response received:
${opts.quoteText}

Provide 3-5 concise bullet points covering:
- Price (including VAT status)
- Timeline / availability
- Scope / what's included
- Any conditions, exclusions or concerns
- Warranty if mentioned

Use bullet points (•). Be factual and concise. Highlight any red flags.`

  const response = await client.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages:   [{ role: 'user', content: prompt }],
  })

  return (response.content[0] as { text: string }).text.trim()
}
