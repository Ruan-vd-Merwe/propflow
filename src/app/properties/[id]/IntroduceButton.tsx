'use client'
import { useState } from 'react'

interface Props {
  tenantId: string
  propertyId: string
  alreadyRequested: boolean
}

export function IntroduceButton({ tenantId, propertyId, alreadyRequested }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'sent' | 'error'>(
    alreadyRequested ? 'sent' : 'idle',
  )

  async function handleClick() {
    if (state !== 'idle' && state !== 'error') return
    setState('loading')
    try {
      const res = await fetch('/api/introductions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, property_id: propertyId }),
      })
      // 409 = already requested — treat as success
      if (res.ok || res.status === 409) {
        setState('sent')
      } else {
        setState('error')
      }
    } catch {
      setState('error')
    }
  }

  if (state === 'sent') {
    return (
      <div className="flex items-center justify-center gap-1.5 rounded-lg border border-green-200 bg-green-50 py-2 text-sm font-medium text-green-700">
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        Introduction requested
      </div>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === 'loading'}
      className="w-full rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 active:scale-[0.98] disabled:opacity-60"
    >
      {state === 'loading' ? 'Sending…' : state === 'error' ? 'Retry' : 'Request Introduction'}
    </button>
  )
}
