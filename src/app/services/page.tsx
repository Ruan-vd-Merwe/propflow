import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NavBar } from '@/components/NavBar'

export const dynamic = 'force-dynamic'

type ServiceCategory = {
  id: string
  name: string
  icon: string | null
  description: string | null
  sort_order: number
}

type ServiceProvider = {
  id: string
  category_id: string
  name: string
  phone: string | null
  whatsapp: string | null
  area: string | null
  province: string | null
  rate_description: string | null
  is_active: boolean
}

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: { cat?: string; province?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  // Load categories
  const { data: cats } = await service
    .from('service_categories')
    .select('*')
    .order('sort_order')

  const categories: ServiceCategory[] = (cats ?? []) as ServiceCategory[]

  // Load providers (filtered by category if selected)
  let provQuery = service
    .from('service_providers')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (searchParams.cat) provQuery = provQuery.eq('category_id', searchParams.cat)
  if (searchParams.province) provQuery = provQuery.eq('province', searchParams.province)

  const { data: provs } = await provQuery
  const providers: ServiceProvider[] = (provs ?? []) as ServiceProvider[]

  const selectedCat = categories.find((c) => c.id === searchParams.cat)

  // Get landlord's first property for context
  const { data: props } = await supabase
    .from('properties')
    .select('id, name, province')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const properties = props ?? []

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
            <Link href="/dashboard" className="hover:text-slate-900">Dashboard</Link>
            <span>/</span>
            <span className="text-slate-900">Services</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-900">Services Marketplace</h1>
          <p className="mt-1 text-sm text-slate-500">
            Book local services for your tenants. Providers are notified via WhatsApp.
          </p>
        </div>

        {/* Category grid */}
        <div className="mb-8 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {categories.map((cat) => {
            const isSelected = searchParams.cat === cat.id
            const providerCount = (provs ?? []).filter((p) => p.category_id === cat.id).length
            const href = isSelected
              ? '/services'
              : `/services?cat=${cat.id}${searchParams.province ? `&province=${searchParams.province}` : ''}`
            return (
              <Link
                key={cat.id}
                href={href}
                className={`card flex items-start gap-4 p-5 transition hover:shadow-md ${
                  isSelected ? 'border-violet-400 bg-violet-50 ring-1 ring-violet-300' : ''
                }`}
              >
                <span className="mt-0.5 text-3xl">{cat.icon ?? '📦'}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{cat.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500 leading-snug">{cat.description}</p>
                  {!searchParams.cat && (
                    <p className="mt-1.5 text-xs font-medium text-violet-600">
                      {providerCount} provider{providerCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {/* Providers */}
        {searchParams.cat && (
          <div>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">
                {selectedCat?.icon} {selectedCat?.name} providers
              </h2>
              <span className="text-sm text-slate-400">
                {providers.length} available
              </span>
            </div>

            {providers.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-slate-500">No providers found for this category.</p>
                <p className="mt-1 text-sm text-slate-400">Try a different filter or check back soon.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {providers.map((prov) => (
                  <ProviderCard
                    key={prov.id}
                    provider={prov}
                    categoryName={selectedCat?.name ?? ''}
                    properties={properties}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {!searchParams.cat && (
          <div className="card p-8 text-center">
            <p className="text-base font-medium text-slate-700">Select a category above</p>
            <p className="mt-1 text-sm text-slate-400">
              Choose a service type to see available providers in your area.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

// ─── Provider card ────────────────────────────────────────────────────────────

function ProviderCard({
  provider,
  categoryName,
  properties,
}: {
  provider: ServiceProvider
  categoryName: string
  properties: { id: string; name: string; province: string | null }[]
}) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{provider.name}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            📍 {provider.area ?? provider.province ?? 'Various areas'}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700">
          {provider.rate_description ?? 'Contact for rates'}
        </span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {provider.phone && (
          <a
            href={`tel:${provider.phone}`}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            📞 {provider.phone}
          </a>
        )}
        {provider.whatsapp && (
          <a
            href={`https://wa.me/27${provider.whatsapp.replace(/^0/, '')}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-100"
          >
            💬 WhatsApp
          </a>
        )}
      </div>

      {/* Book for a property */}
      {properties.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer list-none rounded-lg bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-slate-700">
            📅 Book this provider
          </summary>
          <div className="mt-3">
            <BookingForm
              providerId={provider.id}
              providerName={provider.name}
              categoryName={categoryName}
              properties={properties}
            />
          </div>
        </details>
      )}
    </div>
  )
}

// ─── Booking form (client component boundary needed — keep as server for now) ─

function BookingForm({
  providerId,
  providerName,
  categoryName,
  properties,
}: {
  providerId: string
  providerName: string
  categoryName: string
  properties: { id: string; name: string; province: string | null }[]
}) {
  // Rendered server-side; JS form submission handled by ServiceBookingForm client component
  return (
    <ServiceBookingFormEmbed
      providerId={providerId}
      providerName={providerName}
      categoryName={categoryName}
      properties={properties}
    />
  )
}

function ServiceBookingFormEmbed({
  providerId,
  providerName,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  categoryName: _categoryName,
  properties,
}: {
  providerId: string
  providerName: string
  categoryName: string
  properties: { id: string; name: string }[]
}) {
  return (
    <form
      method="POST"
      action="/api/service-bookings"
      className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
    >
      <input type="hidden" name="provider_id" value={providerId} />

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Property</label>
        <select name="property_id" className="input-field text-sm" required>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Preferred date</label>
        <input
          type="date"
          name="scheduled_date"
          className="input-field text-sm"
          min={new Date().toISOString().split('T')[0]}
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Notes (optional)</label>
        <textarea name="notes" className="input-field resize-none text-sm" rows={2}
          placeholder={`Any details for ${providerName}…`} />
      </div>

      <button type="submit" className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700">
        Request Booking
      </button>
    </form>
  )
}
