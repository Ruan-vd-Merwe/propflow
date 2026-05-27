'use client'

import { useState } from 'react'

export function SharePortalButton({
  portalToken,
  tenantName,
}: {
  portalToken: string
  tenantName: string
}) {
  const [copied, setCopied] = useState(false)

  function copy() {
    const url = `${typeof window !== 'undefined' ? window.location.origin : 'https://propflow-delta-two.vercel.app'}/tenant/${portalToken}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); copy() }}
      title={`Copy portal link for ${tenantName}`}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
        copied
          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      {copied ? (
        <>✓ Copied!</>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Portal link
        </>
      )}
    </button>
  )
}
