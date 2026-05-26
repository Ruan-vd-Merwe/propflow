import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NavBar } from '@/components/NavBar'
import { ComponentsPanel } from './ComponentsPanel'
import type { PropertyComponent } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PropertyComponentsPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: property } = await supabase
    .from('properties')
    .select('id, name, address, owner_id')
    .eq('id', params.id)
    .single()

  if (!property || property.owner_id !== user.id) notFound()

  const { data: components } = await supabase
    .from('property_components')
    .select('*')
    .eq('property_id', params.id)
    .order('component_type')
    .order('name')

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/dashboard"                     className="hover:text-slate-900">Dashboard</Link>
          <span>/</span>
          <Link href={`/properties/${params.id}`}    className="hover:text-slate-900">{property.name}</Link>
          <span>/</span>
          <span className="text-slate-900">Maintenance</span>
        </nav>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Maintenance Tracker</h1>
          <p className="mt-1 text-sm text-slate-500">{property.address}</p>
        </div>

        <ComponentsPanel
          propertyId={params.id}
          initialComponents={(components ?? []) as PropertyComponent[]}
        />
      </main>
    </div>
  )
}
