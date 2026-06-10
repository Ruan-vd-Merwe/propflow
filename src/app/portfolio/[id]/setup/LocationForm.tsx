"use client";

import { useState } from "react";
import type { PropertyWithFinance } from "@/lib/types";

type Props = {
  property: PropertyWithFinance;
};

const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

export function LocationForm({ property }: Props) {
  const [suburb, setSuburb] = useState(property.suburb ?? "");
  const [city, setCity] = useState(property.city ?? "");
  const [province, setProvince] = useState(property.province ?? "");
  const [postalCode, setPostalCode] = useState(property.postal_code ?? "");
  const [latStr, setLatStr] = useState(
    property.latitude != null ? String(property.latitude) : "",
  );
  const [lngStr, setLngStr] = useState(
    property.longitude != null ? String(property.longitude) : "",
  );
  const [areaNews, setAreaNews] = useState(property.area_news_enabled);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const body: Record<string, string | number | boolean | null> = {
        property_id: property.id,
        suburb: suburb.trim() || null,
        city: city.trim() || null,
        province: province || null,
        postal_code: postalCode.trim() || null,
        area_news_enabled: areaNews,
        latitude: latStr ? parseFloat(latStr) : null,
        longitude: lngStr ? parseFloat(lngStr) : null,
      };

      const res = await fetch("/api/portfolio/update-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to save");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-6">
      <h2 className="mb-1 text-base font-semibold text-slate-900">
        Location details
      </h2>
      <p className="mb-5 text-xs text-slate-400">
        Used for area matching and property news. Not shared publicly unless the
        property is listed.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Suburb">
          <input
            type="text"
            className="input-field"
            value={suburb}
            onChange={(e) => setSuburb(e.target.value)}
            placeholder="e.g. Sea Point"
          />
        </FormField>

        <FormField label="City">
          <input
            type="text"
            className="input-field"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Cape Town"
          />
        </FormField>

        <FormField label="Province">
          <select
            className="input-field"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
          >
            <option value="">— Select province —</option>
            {SA_PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Postal code">
          <input
            type="text"
            className="input-field"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="e.g. 8005"
            maxLength={10}
          />
        </FormField>

        <FormField
          label="Latitude"
          hint="Optional — used for map pin"
        >
          <input
            type="number"
            className="input-field"
            value={latStr}
            onChange={(e) => setLatStr(e.target.value)}
            placeholder="-33.9249"
            step="0.0000001"
          />
        </FormField>

        <FormField
          label="Longitude"
          hint="Optional — used for map pin"
        >
          <input
            type="number"
            className="input-field"
            value={lngStr}
            onChange={(e) => setLngStr(e.target.value)}
            placeholder="18.4241"
            step="0.0000001"
          />
        </FormField>
      </div>

      <label className="mt-4 flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={areaNews}
          onChange={(e) => setAreaNews(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-slate-700">
          Enable area news for this property
        </span>
      </label>

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-primary max-w-xs"
        >
          {saving ? "Saving…" : "Save location"}
        </button>
        {saved && (
          <span className="text-sm text-emerald-600">Saved</span>
        )}
      </div>
    </div>
  );
}

function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
