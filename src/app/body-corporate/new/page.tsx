import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NavBar } from '@/components/NavBar'
import { BodyCorporateForm } from './BodyCorporateForm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function NewBodyCorporatePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: properties } = await supabase
    .from('properties')
    .select('id, name')
    .eq('owner_id', user.id)
    .order('name')

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <main className="mx-auto max-w-3xl px-6 py-8">
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/dashboard" className="hover:text-slate-900">Dashboard</Link>
          <span>/</span>
          <Link href="/body-corporate" className="hover:text-slate-900">Body Corporate</Link>
          <span>/</span>
          <span className="text-slate-900">Parse Minutes</span>
        </nav>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Parse Meeting Minutes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload a PDF or paste the text of body corporate meeting minutes. Claude AI will extract
            and flag special levies, maintenance issues, legal disputes, and action items.
          </p>
        </div>

        <BodyCorporateForm properties={properties ?? []} />
      </main>
    </div>
  )
}
