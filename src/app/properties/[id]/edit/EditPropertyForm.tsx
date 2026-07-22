"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
];

const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "townhouse", label: "Townhouse" },
  { value: "room", label: "Room" },
];

type PropertyData = {
  id: string;
  name: string;
  address: string;
  property_type?: string | null;
  bedrooms?: number | null;
  asking_rent?: number | null;
  available_from?: string | null;
  suburb?: string | null;
  province?: string | null;
  postal_code?: string | null;
  description?: string | null;
  floor_size_m2?: number | null;
  pets_allowed?: boolean;
  parking_available?: boolean;
  fibre_available?: boolean;
  is_published?: boolean;
};

type TenantData = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  monthly_rent: number;
  lease_start: string;
  lease_end: string | null;
};

function centsToRand(cents: number | null | undefined): string {
  if (cents == null || cents === 0) return "";
  return (cents / 100).toString();
}

function randToCents(rand: string): number | null {
  const n = parseFloat(rand.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? null : Math.round(n * 100);
}

function fmtRand(cents: number) {
  return `R ${(cents / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
}

export function EditPropertyForm({
  property,
  tenants: initialTenants,
}: {
  property: PropertyData;
  tenants: TenantData[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Property fields
  const [name, setName] = useState(property.name);
  const [address, setAddress] = useState(property.address);
  const [propertyType, setPropertyType] = useState(property.property_type ?? "");
  const [bedrooms, setBedrooms] = useState(property.bedrooms?.toString() ?? "");
  const [askingRent, setAskingRent] = useState(centsToRand(property.asking_rent));
  const [availableFrom, setAvailableFrom] = useState(property.available_from ?? "");
  const [suburb, setSuburb] = useState(property.suburb ?? "");
  const [province, setProvince] = useState(property.province ?? "");
  const [postalCode, setPostalCode] = useState(property.postal_code ?? "");
  const [description, setDescription] = useState(property.description ?? "");
  const [floorSize, setFloorSize] = useState(property.floor_size_m2?.toString() ?? "");
  const [petsAllowed, setPetsAllowed] = useState(property.pets_allowed ?? false);
  const [parkingAvailable, setParkingAvailable] = useState(property.parking_available ?? false);
  const [fibreAvailable, setFibreAvailable] = useState(property.fibre_available ?? false);
  // undefined before the public-listings migration has been run against
  // this database (see supabase/migrations/20260720120000_public_listings.sql).
  // The toggle is hidden entirely in that case rather than guessing a value.
  const publishSupported = property.is_published !== undefined;
  const [isPublished, setIsPublished] = useState(property.is_published ?? false);
  const [publishSaving, setPublishSaving] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Tenants
  const [tenants, setTenants] = useState<TenantData[]>(initialTenants);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Add tenant form
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRent, setNewRent] = useState("");
  const [newLeaseStart, setNewLeaseStart] = useState("");
  const [newLeaseEnd, setNewLeaseEnd] = useState("");
  const [addingTenant, setAddingTenant] = useState(false);
  const [tenantError, setTenantError] = useState<string | null>(null);

  async function handleSaveProperty() {
    if (!name.trim() || !address.trim()) {
      setError("Property name and address are required.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const { error: updateErr } = await supabase
      .from("properties")
      .update({
        name: name.trim(),
        address: address.trim(),
        property_type: propertyType || null,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        asking_rent: randToCents(askingRent),
        available_from: availableFrom || null,
        suburb: suburb.trim() || null,
        province: province || null,
        postal_code: postalCode.trim() || null,
        description: description.trim() || null,
        floor_size_m2: floorSize ? parseInt(floorSize) : null,
        pets_allowed: petsAllowed,
        parking_available: parkingAvailable,
        fibre_available: fibreAvailable,
      })
      .eq("id", property.id);

    setSaving(false);

    if (updateErr) {
      setError(updateErr.message);
      return;
    }

    setSuccess("Property updated.");
    router.push(`/properties/${property.id}`);
    router.refresh();
  }

  async function handleTogglePublish() {
    const next = !isPublished;
    setPublishSaving(true);
    setPublishError(null);

    const { error: publishErr } = await supabase
      .from("properties")
      .update({ is_published: next })
      .eq("id", property.id);

    setPublishSaving(false);

    if (publishErr) {
      console.error("[edit-property] publish toggle failed:", publishErr.message);
      setPublishError(publishErr.message);
      return;
    }

    setIsPublished(next);
    router.refresh();
  }

  async function handleAddTenant() {
    if (!newName.trim() || !newEmail.trim() || !newRent || !newLeaseStart) {
      setTenantError("Name, email, rent and lease start are required.");
      return;
    }

    const rentCents = randToCents(newRent);
    if (!rentCents || rentCents <= 0) {
      setTenantError("Enter a valid rent amount.");
      return;
    }

    setAddingTenant(true);
    setTenantError(null);

    const { data: tenant, error: insertErr } = await supabase
      .from("tenants")
      .insert({
        property_id: property.id,
        full_name: newName.trim(),
        email: newEmail.trim(),
        phone: newPhone.trim() || null,
        monthly_rent: rentCents,
        lease_start: newLeaseStart,
        lease_end: newLeaseEnd || null,
      })
      .select("id, full_name, email, phone, monthly_rent, lease_start, lease_end")
      .single();

    setAddingTenant(false);

    if (insertErr) {
      setTenantError(insertErr.message);
      return;
    }

    if (tenant) {
      setTenants((prev) => [...prev, tenant]);
    }

    setNewName("");
    setNewEmail("");
    setNewPhone("");
    setNewRent("");
    setNewLeaseStart("");
    setNewLeaseEnd("");
    setShowAddTenant(false);
  }

  async function handleRemoveTenant(tenantId: string) {
    setRemovingId(tenantId);
    setTenantError(null);

    const { error: deleteErr } = await supabase
      .from("tenants")
      .delete()
      .eq("id", tenantId);

    setRemovingId(null);

    if (deleteErr) {
      setTenantError(deleteErr.message);
      return;
    }

    setTenants((prev) => prev.filter((t) => t.id !== tenantId));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Edit property</h1>

      {/* ── Public listing page ── */}
      {publishSupported && (
        <div className="card p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Public listing page
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {isPublished
                  ? "This property has a shareable public link. Anyone with the link can view it and apply."
                  : "Publish to get a shareable public link for WhatsApp or Facebook. No landlord contact details are shown, applying through PropTrust is the contact channel."}
              </p>
            </div>
            <button
              type="button"
              disabled={publishSaving}
              onClick={handleTogglePublish}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                isPublished
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {publishSaving ? "Saving…" : isPublished ? "Published" : "Unpublished"}
            </button>
          </div>
          {publishError && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {publishError}
            </div>
          )}
          {isPublished && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <span className="truncate">
                {typeof window !== "undefined" ? window.location.origin : ""}
                /listings/{property.id}
              </span>
              <button
                type="button"
                onClick={() =>
                  navigator.clipboard.writeText(
                    `${window.location.origin}/listings/${property.id}`,
                  )
                }
                className="shrink-0 rounded-md border border-slate-300 bg-white px-2 py-1 font-medium text-slate-700 hover:bg-slate-100"
              >
                Copy link
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Property details ── */}
      <div className="card p-5">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Property details
        </h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Property name *
            </label>
            <input
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Address *
            </label>
            <input
              className="input-field"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Property type
              </label>
              <select
                className="input-field"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
              >
                <option value="">Select…</option>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Bedrooms
              </label>
              <input
                type="number"
                className="input-field"
                min={0}
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                placeholder="e.g. 2"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Asking rent (Rand)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                  R
                </span>
                <input
                  type="number"
                  className="input-field pl-7"
                  min={0}
                  value={askingRent}
                  onChange={(e) => setAskingRent(e.target.value)}
                  placeholder="12 000"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Available from
              </label>
              <input
                type="date"
                className="input-field"
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Suburb
              </label>
              <input
                className="input-field"
                value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
                placeholder="e.g. Sea Point"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Province
              </label>
              <select
                className="input-field"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
              >
                <option value="">Select…</option>
                {PROVINCES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Postal code
              </label>
              <input
                className="input-field"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="8001"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Floor size (m²)
            </label>
            <input
              type="number"
              className="input-field"
              min={0}
              value={floorSize}
              onChange={(e) => setFloorSize(e.target.value)}
              placeholder="e.g. 65"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Features
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Pet friendly", checked: petsAllowed, set: setPetsAllowed },
                { label: "Parking", checked: parkingAvailable, set: setParkingAvailable },
                { label: "Fibre internet", checked: fibreAvailable, set: setFibreAvailable },
              ].map((f) => (
                <label
                  key={f.label}
                  className={`flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                    f.checked
                      ? "border-slate-800 bg-slate-800 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={f.checked}
                    onChange={(e) => f.set(e.target.checked)}
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              className="input-field min-h-[80px] resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what makes this property special..."
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push(`/properties/${property.id}`)}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !name.trim() || !address.trim()}
            onClick={handleSaveProperty}
            className="rounded-xl bg-blue-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save property"}
          </button>
        </div>
      </div>

      {/* ── Tenants ── */}
      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Tenants
            <span className="ml-2 text-sm font-normal text-slate-400">
              {tenants.length} total
            </span>
          </h2>
          {!showAddTenant && (
            <button
              type="button"
              onClick={() => setShowAddTenant(true)}
              className="rounded-lg bg-blue-700 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-blue-800"
            >
              + Add tenant
            </button>
          )}
        </div>

        {tenantError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {tenantError}
          </div>
        )}

        {/* Existing tenants */}
        {tenants.length === 0 && !showAddTenant && (
          <p className="py-6 text-center text-sm text-slate-400">
            No tenants linked to this property.
          </p>
        )}

        {tenants.length > 0 && (
          <div className="mb-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
            {tenants.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{t.full_name}</p>
                  <p className="text-xs text-slate-500">{t.email}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {fmtRand(t.monthly_rent)}/mo · Lease from{" "}
                    {new Date(t.lease_start).toLocaleDateString("en-ZA", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={removingId === t.id}
                  onClick={() => handleRemoveTenant(t.id)}
                  className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  {removingId === t.id ? "Removing…" : "Remove"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add tenant form */}
        {showAddTenant && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">
              Add a tenant
            </h3>
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Full name *
                  </label>
                  <input
                    className="input-field"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Email *
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="jane@example.com"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Phone
                  </label>
                  <input
                    type="tel"
                    className="input-field"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="082 555 1234"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Monthly rent (Rand) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                      R
                    </span>
                    <input
                      type="number"
                      className="input-field pl-7"
                      min={0}
                      value={newRent}
                      onChange={(e) => setNewRent(e.target.value)}
                      placeholder="12 000"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Lease start *
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={newLeaseStart}
                    onChange={(e) => setNewLeaseStart(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Lease end
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={newLeaseEnd}
                    onChange={(e) => setNewLeaseEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={addingTenant}
                  onClick={handleAddTenant}
                  className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-50"
                >
                  {addingTenant ? "Adding…" : "Add tenant"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTenant(false);
                    setTenantError(null);
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
