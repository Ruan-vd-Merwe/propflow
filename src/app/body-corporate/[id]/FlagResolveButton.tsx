'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function FlagResolveButton({
  documentId,
  flagId,
  resolved,
}: {
  documentId: string
  flagId:     string
  resolved:   boolean
}) {
  const router   = useRouter()
  const [busy, setBusy] = useState(false)

  async function toggle() {
    setBusy(true)
    await fetch(`/api/body-corporate/${documentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flag_id: flagId, resolved: !resolved }),
    })
    router.refresh()
    setBusy(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
        resolved
          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          : 'bg-emerald-600 text-white hover:bg-emerald-700'
      }`}
    >
      {busy ? '…' : resolved ? 'Re-open' : 'Mark resolved'}
    </button>
  )
}

export function DeleteForm({ documentId }: { documentId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this document and all its flags? This cannot be undone.')) return
    setBusy(true)
    await fetch(`/api/body-corporate/${documentId}`, { method: 'DELETE' })
    router.push('/body-corporate')
  }

  return (
    <button
      onClick={handleDelete}
      disabled={busy}
      className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
    >
      {busy ? 'Deleting…' : 'Delete document'}
    </button>
  )
}
