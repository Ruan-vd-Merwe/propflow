"use client";

import { useState } from "react";
import type { ListingCopyFacts, ListingCopyTone } from "@/lib/anthropic";
import type { ListingFormSnapshot } from "./types";

const CHECKLIST: {
  key: string;
  label: string;
  question: string;
  done: (f: ListingFormSnapshot, hasPhotos: boolean) => boolean;
}[] = [
  { key: "type", label: "Property type", question: "What type of property is it?", done: (f) => !!f.property_type },
  { key: "beds", label: "Bedrooms", question: "How many bedrooms?", done: (f) => f.bedrooms != null },
  { key: "baths", label: "Bathrooms", question: "How many bathrooms?", done: (f) => f.bathrooms != null },
  { key: "rent", label: "Monthly rent", question: "What's the monthly rent?", done: (f) => f.asking_rent != null },
  { key: "deposit", label: "Deposit", question: "What deposit are you asking for?", done: (f) => f.deposit_amount != null },
  { key: "available", label: "Availability", question: "When is it available from?", done: (f) => !!f.available_from },
  { key: "suburb", label: "Suburb", question: "What suburb is it in?", done: (f) => !!f.suburb },
  {
    key: "policies",
    label: "Pet & parking policy",
    question: "What's your pet and parking policy?",
    done: (f) => f.pets_allowed || f.parking_available || f.fibre_available,
  },
  {
    key: "features",
    label: "Features",
    question: "Any standout features worth mentioning?",
    done: (f) => f.property_tags.length + f.area_tags.length + f.lifestyle_tags.length > 0,
  },
  {
    key: "description",
    label: "Description",
    question: "Can you describe the property in a sentence or two?",
    done: (f) => !!f.description && f.description.trim().length > 20,
  },
  { key: "photos", label: "Photos", question: "Add a few photos to attract more applicants.", done: (_f, hasPhotos) => hasPhotos },
];

const TONE_BUTTONS: { tone: ListingCopyTone; label: string }[] = [
  { tone: "default", label: "Improve my description" },
  { tone: "concise", label: "Make it more concise" },
  { tone: "warm", label: "Make it warmer" },
  { tone: "professional", label: "Make it more professional" },
];

export function ListingImprovementPanel({
  formSnapshot,
  hasPhotos,
  currentName,
  currentDescription,
  onApplyTitle,
  onApplyDescription,
  onDone,
}: {
  formSnapshot: ListingFormSnapshot;
  hasPhotos: boolean;
  currentName: string;
  currentDescription: string;
  onApplyTitle: (title: string) => void;
  onApplyDescription: (description: string) => void;
  onDone: () => void;
}) {
  const [draft, setDraft] = useState<{ title: string; description: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const done = CHECKLIST.filter((c) => c.done(formSnapshot, hasPhotos));
  const gaps = CHECKLIST.filter((c) => !c.done(formSnapshot, hasPhotos));
  const score = Math.round((done.length / CHECKLIST.length) * 100);

  async function generate(tone: ListingCopyTone) {
    setGenerating(true);
    setError(null);
    const facts: ListingCopyFacts = {
      property_type: formSnapshot.property_type,
      bedrooms: formSnapshot.bedrooms,
      bathrooms: formSnapshot.bathrooms,
      suburb: formSnapshot.suburb,
      asking_rent: formSnapshot.asking_rent,
      available_from: formSnapshot.available_from,
      pets_allowed: formSnapshot.pets_allowed,
      parking_available: formSnapshot.parking_available,
      fibre_available: formSnapshot.fibre_available,
      property_tags: formSnapshot.property_tags,
      area_tags: formSnapshot.area_tags,
      lifestyle_tags: formSnapshot.lifestyle_tags,
    };
    try {
      const res = await fetch("/api/properties/generate-listing-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facts, tone }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not generate a draft right now.");
        return;
      }
      setDraft(json.draft);
    } catch {
      setError("Network error, try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Improve your listing
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Optional, you can also do this later from the description field.
          </p>
        </div>
        <button
          type="button"
          onClick={onDone}
          className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
        >
          Continue to form
        </button>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Listing completeness</span>
          <span className="font-semibold text-slate-700">{score}%</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {done.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-slate-600">Looking good</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {done.map((c) => (
              <span
                key={c.key}
                className="rounded-full bg-blue-100 px-2.5 py-1 text-xs text-blue-700"
              >
                {c.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {gaps.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-slate-600">
            Still missing, worth adding
          </p>
          <ul className="mt-1 space-y-1">
            {gaps.map((c) => (
              <li key={c.key} className="text-xs text-slate-500">
                • {c.question}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 border-t border-slate-200 pt-3">
        <p className="text-xs font-medium text-slate-600">
          Draft a better title and description
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TONE_BUTTONS.map((t) => (
            <button
              key={t.tone}
              type="button"
              onClick={() => void generate(t.tone)}
              disabled={generating}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50"
            >
              {t.label}
            </button>
          ))}
        </div>

        {generating && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
            <span className="motion-safe:animate-spin h-3.5 w-3.5 shrink-0 rounded-full border-2 border-slate-300 border-t-blue-700" />
            Writing a draft using only the facts you&apos;ve given us…
          </div>
        )}
        {error && <p className="mt-2 text-xs text-red-700">{error}</p>}

        {draft && !generating && (
          <div className="mt-3 space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <span className="inline-block rounded-full bg-blue-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              Draft, review before applying
            </span>

            <div>
              <p className="text-xs font-medium text-slate-500">
                Suggested title
              </p>
              <p className="mt-0.5 text-sm text-slate-800">{draft.title}</p>
              {currentName && (
                <p className="mt-1 text-xs text-slate-400">
                  Currently: {currentName}
                </p>
              )}
              <button
                type="button"
                onClick={() => onApplyTitle(draft.title)}
                className="mt-1.5 rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
              >
                Use this title
              </button>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500">
                Suggested description
              </p>
              <p className="mt-0.5 whitespace-pre-line text-sm text-slate-800">
                {draft.description}
              </p>
              {currentDescription && (
                <p className="mt-1 text-xs text-slate-400">
                  Your current description is kept unless you apply this.
                </p>
              )}
              <button
                type="button"
                onClick={() => onApplyDescription(draft.description)}
                className="mt-1.5 rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
              >
                Use this description
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onDone}
        className="mt-4 flex min-h-[44px] w-full items-center justify-center rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
      >
        Continue to form
      </button>
    </div>
  );
}
