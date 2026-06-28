"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { NavBar } from "@/components/NavBar";

// ─── Tag definitions ──────────────────────────────────────────────────────────

const PROPERTY_TAGS: { value: string; label: string }[] = [
  { value: "fibre_available", label: "Fibre internet" },
  { value: "building_security", label: "Building security" },
  { value: "parking", label: "Parking" },
  { value: "pool", label: "Pool" },
  { value: "garden", label: "Garden" },
  { value: "balcony", label: "Balcony" },
  { value: "braai_area", label: "Braai area" },
  { value: "solar", label: "Solar / backup power" },
  { value: "storage", label: "Storage room" },
  { value: "pets_allowed", label: "Pet-friendly" },
  { value: "air_conditioning", label: "Air conditioning" },
  { value: "dishwasher", label: "Dishwasher" },
];

const AREA_TAGS: { value: string; label: string }[] = [
  { value: "good_schools", label: "Good schools" },
  { value: "retail_access", label: "Close to shops" },
  { value: "public_transport", label: "Public transport" },
  { value: "green_space", label: "Parks & green space" },
  { value: "nightlife", label: "Nightlife" },
  { value: "coffee_culture", label: "Coffee shops" },
  { value: "beach_access", label: "Near the beach" },
  { value: "mountains", label: "Mountain views" },
  { value: "quiet_suburb", label: "Quiet suburb" },
  { value: "walkable", label: "Walkable area" },
];

const LIFESTYLE_TAGS: { value: string; label: string }[] = [
  { value: "remote_work", label: "Remote work vibes" },
  { value: "outdoor_lifestyle", label: "Outdoor lifestyle" },
  { value: "social_life", label: "Active social life" },
  { value: "gym_access", label: "Gym nearby" },
  { value: "running_cycling", label: "Running / cycling" },
  { value: "restaurants", label: "Restaurant scene" },
  { value: "dog_walking", label: "Dog walking routes" },
  { value: "arts_culture", label: "Arts & culture" },
];

const BEDROOM_OPTIONS = [
  { value: 0, label: "Studio" },
  { value: 1, label: "1 bed" },
  { value: 2, label: "2 bed" },
  { value: 3, label: "3 bed" },
  { value: 4, label: "4+ bed" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toggle(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TagGrid({
  tags,
  selected,
  mustHaves,
  onChange,
  onMustHaveToggle,
}: {
  tags: { value: string; label: string }[];
  selected: string[];
  mustHaves: string[];
  onChange: (val: string) => void;
  onMustHaveToggle: (val: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t) => {
        const isSelected = selected.includes(t.value);
        const isMust = mustHaves.includes(t.value);
        return (
          <div key={t.value} className="flex items-center gap-0">
            <button
              type="button"
              onClick={() => onChange(t.value)}
              className={`rounded-l-full border px-3 py-1.5 text-sm font-medium transition ${
                isSelected
                  ? "border-slate-800 bg-slate-800 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
              }`}
            >
              {t.label}
            </button>
            {isSelected && (
              <button
                type="button"
                title="Mark as must-have"
                onClick={() => onMustHaveToggle(t.value)}
                className={`rounded-r-full border-y border-r px-2 py-1.5 text-xs transition ${
                  isMust
                    ? "border-amber-400 bg-amber-400 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-300 hover:text-amber-400"
                }`}
              >
                must
              </button>
            )}
            {!isSelected && (
              <div className="h-[34px] w-0 rounded-r-full border-y border-r border-slate-200 bg-white" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="mb-0.5 text-base font-semibold text-slate-900">{title}</h2>
      {hint && <p className="mb-4 text-xs text-slate-400">{hint}</p>}
      {!hint && <div className="mb-4" />}
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Prefs = {
  desired_bedrooms: number | null;
  has_car: boolean;
  has_pets: boolean;
  work_location: string;
  property_interests: string[];
  area_interests: string[];
  lifestyle_interests: string[];
  must_haves: string[];
  dealbreakers: string[];
};

const DEFAULT_PREFS: Prefs = {
  desired_bedrooms: null,
  has_car: true,
  has_pets: false,
  work_location: "",
  property_interests: [],
  area_interests: [],
  lifestyle_interests: [],
  must_haves: [],
  dealbreakers: [],
};

export default function TenantPreferencesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setProfileId(user.id);
      const { data: tp } = await supabase
        .from("tenant_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (tp) {
        setPrefs({
          desired_bedrooms: tp.desired_bedrooms ?? null,
          has_car: tp.has_car ?? true,
          has_pets: tp.has_pets ?? false,
          work_location: tp.work_location ?? "",
          property_interests: tp.property_interests ?? [],
          area_interests: tp.area_interests ?? [],
          lifestyle_interests: tp.lifestyle_interests ?? [],
          must_haves: tp.must_haves ?? [],
          dealbreakers: tp.dealbreakers ?? [],
        });
      }
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function save() {
    if (!profileId) return;
    setSaving(true);
    const { error } = await supabase
      .from("tenant_profiles")
      .update({
        desired_bedrooms: prefs.desired_bedrooms,
        has_car: prefs.has_car,
        has_pets: prefs.has_pets,
        work_location: prefs.work_location || null,
        property_interests: prefs.property_interests,
        area_interests: prefs.area_interests,
        lifestyle_interests: prefs.lifestyle_interests,
        must_haves: prefs.must_haves,
        dealbreakers: prefs.dealbreakers,
      })
      .eq("user_id", profileId);
    setSaving(false);
    if (error) {
      showToast("Save failed: " + error.message);
      return;
    }
    showToast("Preferences saved — your match scores will update now.");
  }

  function toggleProp(val: string) {
    setPrefs((p) => {
      const next = toggle(p.property_interests, val);
      return {
        ...p,
        property_interests: next,
        must_haves: p.must_haves.filter((v) => next.includes(v)),
        dealbreakers: p.dealbreakers.filter((v) => next.includes(v)),
      };
    });
  }

  function toggleArea(val: string) {
    setPrefs((p) => {
      const next = toggle(p.area_interests, val);
      return {
        ...p,
        area_interests: next,
        must_haves: p.must_haves.filter(
          (v) =>
            next.includes(v) ||
            p.property_interests.includes(v) ||
            p.lifestyle_interests.includes(v),
        ),
        dealbreakers: p.dealbreakers.filter(
          (v) =>
            next.includes(v) ||
            p.property_interests.includes(v) ||
            p.lifestyle_interests.includes(v),
        ),
      };
    });
  }

  function toggleLifestyle(val: string) {
    setPrefs((p) => {
      const next = toggle(p.lifestyle_interests, val);
      return {
        ...p,
        lifestyle_interests: next,
        must_haves: p.must_haves.filter(
          (v) =>
            next.includes(v) ||
            p.property_interests.includes(v) ||
            p.area_interests.includes(v),
        ),
        dealbreakers: p.dealbreakers.filter(
          (v) =>
            next.includes(v) ||
            p.property_interests.includes(v) ||
            p.area_interests.includes(v),
        ),
      };
    });
  }

  function toggleMustHave(val: string) {
    setPrefs((p) => ({
      ...p,
      must_haves: toggle(p.must_haves, val),
      dealbreakers: p.dealbreakers.filter((v) => v !== val),
    }));
  }

  function toggleDealbreaker(val: string) {
    setPrefs((p) => ({
      ...p,
      dealbreakers: toggle(p.dealbreakers, val),
      must_haves: p.must_haves.filter((v) => v !== val),
    }));
  }

  const allSelected = [
    ...prefs.property_interests,
    ...prefs.area_interests,
    ...prefs.lifestyle_interests,
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavBar />
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/tenant/profile"
            className="text-sm text-slate-400 hover:text-slate-700"
          >
            Profile
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-medium text-slate-700">
            Search preferences
          </span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            Search preferences
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tell us what matters to you — PropTrust uses this to rank properties
            by how well they fit your life.
          </p>
        </div>

        <div className="space-y-4">
          {/* Basics */}
          <Section title="The basics">
            {/* Bedrooms */}
            <div className="mb-5">
              <p className="mb-2 text-sm font-medium text-slate-700">
                Bedrooms
              </p>
              <div className="flex flex-wrap gap-2">
                {BEDROOM_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() =>
                      setPrefs((p) => ({
                        ...p,
                        desired_bedrooms:
                          p.desired_bedrooms === o.value ? null : o.value,
                      }))
                    }
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                      prefs.desired_bedrooms === o.value
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setPrefs((p) => ({ ...p, desired_bedrooms: null }))
                  }
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                    prefs.desired_bedrooms === null
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                  }`}
                >
                  Any
                </button>
              </div>
            </div>

            {/* Car + Pets */}
            <div className="mb-5 flex flex-wrap gap-4">
              <label className="flex cursor-pointer items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={prefs.has_car}
                  onClick={() =>
                    setPrefs((p) => ({ ...p, has_car: !p.has_car }))
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                    prefs.has_car ? "bg-slate-800" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      prefs.has_car ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="text-sm font-medium text-slate-700">
                  I have a car
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={prefs.has_pets}
                  onClick={() =>
                    setPrefs((p) => ({ ...p, has_pets: !p.has_pets }))
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                    prefs.has_pets ? "bg-slate-800" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      prefs.has_pets ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="text-sm font-medium text-slate-700">
                  I have pets
                </span>
              </label>
            </div>

            {/* Work location */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Work location
                <span className="ml-1 text-xs font-normal text-slate-400">
                  (suburb or area — for commute scoring)
                </span>
              </label>
              <input
                type="text"
                placeholder="e.g. Sandton CBD, Stellenbosch, Remote"
                value={prefs.work_location}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, work_location: e.target.value }))
                }
                className="input-field"
              />
            </div>
          </Section>

          {/* Property features */}
          <Section
            title="Property features"
            hint="Select features you care about. Tap 'must' to mark any as non-negotiable."
          >
            <TagGrid
              tags={PROPERTY_TAGS}
              selected={prefs.property_interests}
              mustHaves={prefs.must_haves}
              onChange={toggleProp}
              onMustHaveToggle={toggleMustHave}
            />
          </Section>

          {/* Area interests */}
          <Section
            title="Area preferences"
            hint="What kind of neighbourhood matters to you?"
          >
            <TagGrid
              tags={AREA_TAGS}
              selected={prefs.area_interests}
              mustHaves={prefs.must_haves}
              onChange={toggleArea}
              onMustHaveToggle={toggleMustHave}
            />
          </Section>

          {/* Lifestyle */}
          <Section
            title="Lifestyle"
            hint="What does your ideal neighbourhood feel like?"
          >
            <TagGrid
              tags={LIFESTYLE_TAGS}
              selected={prefs.lifestyle_interests}
              mustHaves={prefs.must_haves}
              onChange={toggleLifestyle}
              onMustHaveToggle={toggleMustHave}
            />
          </Section>

          {/* Dealbreakers — only show if anything is selected */}
          {allSelected.length > 0 && (
            <Section
              title="Dealbreakers"
              hint="Mark anything from your selections that would disqualify a property outright."
            >
              <div className="flex flex-wrap gap-2">
                {allSelected.map((val) => {
                  const tag =
                    PROPERTY_TAGS.find((t) => t.value === val) ||
                    AREA_TAGS.find((t) => t.value === val) ||
                    LIFESTYLE_TAGS.find((t) => t.value === val);
                  if (!tag) return null;
                  const isDB = prefs.dealbreakers.includes(val);
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => toggleDealbreaker(val)}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                        isDB
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-400"
                      }`}
                    >
                      {isDB ? "No " : ""}
                      {tag.label}
                    </button>
                  );
                })}
              </div>
              {allSelected.length > 0 && prefs.dealbreakers.length === 0 && (
                <p className="mt-3 text-xs text-slate-400">
                  None selected — all preferences are treated as nice-to-haves.
                </p>
              )}
            </Section>
          )}

          {/* Save */}
          <div className="flex items-center justify-between">
            <Link
              href="/tenant/profile"
              className="text-sm text-slate-400 hover:text-slate-700"
            >
              Back to profile
            </Link>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save preferences"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
