"use client";

import { useState } from "react";
import type { PropertyDescriptionExtraction } from "@/lib/anthropic";
import type { ListingFormSnapshot, TagCatalogs } from "./types";

type ScalarKey =
  | "property_type"
  | "bedrooms"
  | "bathrooms"
  | "asking_rent"
  | "deposit_amount"
  | "available_from"
  | "suburb"
  | "description";

const SCALAR_FIELDS: {
  key: ScalarKey;
  label: string;
  type: "select" | "number" | "date" | "text" | "textarea";
  placeholder?: string;
}[] = [
  { key: "property_type", label: "Property type", type: "select" },
  { key: "bedrooms", label: "Bedrooms", type: "number", placeholder: "e.g. 2" },
  { key: "bathrooms", label: "Bathrooms", type: "number", placeholder: "e.g. 1" },
  { key: "asking_rent", label: "Monthly rent (R)", type: "number", placeholder: "e.g. 18500" },
  { key: "deposit_amount", label: "Deposit (R)", type: "number", placeholder: "e.g. 18500" },
  { key: "available_from", label: "Available from", type: "date" },
  { key: "suburb", label: "Suburb", type: "text", placeholder: "e.g. Vredehoek" },
  { key: "description", label: "Description", type: "textarea" },
];

function toDisplay(v: string | number | null | undefined): string {
  return v == null ? "" : String(v);
}

type FieldStatus = "found" | "missing" | "conflict";

function fieldStatus(
  key: ScalarKey,
  extraction: PropertyDescriptionExtraction,
  currentForm: ListingFormSnapshot,
): FieldStatus {
  const extracted = extraction[key];
  const current = currentForm[key];
  const hasCurrent = current != null && String(current) !== "";
  const hasExtracted = extracted != null && String(extracted) !== "";
  if (hasCurrent && hasExtracted && String(extracted) !== String(current)) {
    return "conflict";
  }
  return hasExtracted || hasCurrent ? "found" : "missing";
}

function StatusBadge({
  status,
  uncertain,
}: {
  status: FieldStatus;
  uncertain: boolean;
}) {
  if (status === "conflict")
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
        Conflict
      </span>
    );
  if (status === "missing")
    return (
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
        Missing
      </span>
    );
  if (uncertain)
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
        Please confirm
      </span>
    );
  return (
    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
      Found
    </span>
  );
}

export function ListingAssistantReview({
  extraction,
  transcript,
  currentForm,
  tagCatalogs,
  canContinueRecording,
  onContinueRecording,
  onReanalyse,
  onApply,
  onStartOver,
}: {
  extraction: PropertyDescriptionExtraction;
  transcript: string;
  currentForm: ListingFormSnapshot;
  tagCatalogs: TagCatalogs;
  canContinueRecording: boolean;
  onContinueRecording?: () => void;
  onReanalyse: (newTranscript: string) => void;
  onApply: (fields: Partial<ListingFormSnapshot>) => void;
  onStartOver: () => void;
}) {
  const [values, setValues] = useState<Record<ScalarKey, string>>(() => {
    const init = {} as Record<ScalarKey, string>;
    for (const f of SCALAR_FIELDS) {
      const status = fieldStatus(f.key, extraction, currentForm);
      init[f.key] =
        status === "conflict"
          ? toDisplay(currentForm[f.key])
          : toDisplay(extraction[f.key] ?? currentForm[f.key]);
    }
    return init;
  });
  const [petsAllowed, setPetsAllowed] = useState(
    extraction.pets_allowed ?? currentForm.pets_allowed,
  );
  const [parkingAvailable, setParkingAvailable] = useState(
    extraction.parking_available ?? currentForm.parking_available,
  );
  const [fibreAvailable, setFibreAvailable] = useState(
    extraction.fibre_available ?? currentForm.fibre_available,
  );
  const [propertyTags, setPropertyTags] = useState<string[]>(() =>
    Array.from(new Set([...currentForm.property_tags, ...extraction.property_tags])),
  );
  const [areaTags, setAreaTags] = useState<string[]>(() =>
    Array.from(new Set([...currentForm.area_tags, ...extraction.area_tags])),
  );
  const [lifestyleTags, setLifestyleTags] = useState<string[]>(() =>
    Array.from(new Set([...currentForm.lifestyle_tags, ...extraction.lifestyle_tags])),
  );
  const [showTranscript, setShowTranscript] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState(transcript);

  function updateValue(key: ScalarKey, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  function resolveConflict(key: ScalarKey, pick: "mine" | "suggested") {
    updateValue(
      key,
      pick === "mine" ? toDisplay(currentForm[key]) : toDisplay(extraction[key]),
    );
  }

  function toggleTag(list: string[], set: (v: string[]) => void, value: string) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  const missingCount = SCALAR_FIELDS.filter(
    (f) => fieldStatus(f.key, extraction, currentForm) === "missing",
  ).length;
  const conflictCount = SCALAR_FIELDS.filter(
    (f) => fieldStatus(f.key, extraction, currentForm) === "conflict",
  ).length;
  const foundCount = SCALAR_FIELDS.length - missingCount;

  function handleApply() {
    const parsedNumber = (s: string): number | null => {
      const n = parseFloat(s);
      return s.trim() !== "" && !isNaN(n) ? n : null;
    };
    onApply({
      property_type: values.property_type || null,
      bedrooms: parsedNumber(values.bedrooms),
      bathrooms: parsedNumber(values.bathrooms),
      asking_rent: parsedNumber(values.asking_rent),
      deposit_amount: parsedNumber(values.deposit_amount),
      available_from: values.available_from || null,
      suburb: values.suburb || null,
      description: values.description || null,
      pets_allowed: petsAllowed,
      parking_available: parkingAvailable,
      fibre_available: fibreAvailable,
      property_tags: propertyTags,
      area_tags: areaTags,
      lifestyle_tags: lifestyleTags,
    });
  }

  return (
    <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">
          {conflictCount > 0
            ? `We found ${foundCount} of ${SCALAR_FIELDS.length} details, ${conflictCount} differ from what you'd already entered.`
            : missingCount === 0
              ? `We filled in all ${SCALAR_FIELDS.length} details.`
              : `We caught part of that. Review what we found and add anything missing.`}
        </p>
        {extraction.uncertain_fields.length > 0 && (
          <p className="mt-0.5 text-xs text-amber-700">
            We filled what we could. A few details still need your attention.
          </p>
        )}
        {extraction.parse_recovered && (
          <p className="mt-0.5 text-xs text-slate-500">
            We could not clearly process the last part, but everything else
            was saved below.
          </p>
        )}
      </div>

      <div className="mt-3 space-y-3">
        {SCALAR_FIELDS.map((f) => {
          const status = fieldStatus(f.key, extraction, currentForm);
          const uncertain = extraction.uncertain_fields.includes(f.key);
          return (
            <div key={f.key}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <label className="text-xs font-medium text-slate-600">
                  {f.label}
                </label>
                <StatusBadge status={status} uncertain={uncertain} />
              </div>

              {status === "conflict" && (
                <div className="mb-1.5 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => resolveConflict(f.key, "mine")}
                    className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Keep mine: {toDisplay(currentForm[f.key]) || "—"}
                  </button>
                  <button
                    type="button"
                    onClick={() => resolveConflict(f.key, "suggested")}
                    className="rounded-full border border-blue-300 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                  >
                    Use suggested: {toDisplay(extraction[f.key]) || "—"}
                  </button>
                </div>
              )}

              {f.type === "select" ? (
                <select
                  className="input-field text-sm"
                  value={values[f.key]}
                  onChange={(e) => updateValue(f.key, e.target.value)}
                >
                  <option value="">Select…</option>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="room">Room</option>
                </select>
              ) : f.type === "textarea" ? (
                <textarea
                  className="input-field min-h-[70px] resize-y text-sm"
                  value={values[f.key]}
                  onChange={(e) => updateValue(f.key, e.target.value)}
                  placeholder={f.placeholder}
                />
              ) : (
                <input
                  type={f.type}
                  className="input-field text-sm"
                  value={values[f.key]}
                  onChange={(e) => updateValue(f.key, e.target.value)}
                  placeholder={f.placeholder}
                />
              )}
            </div>
          );
        })}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            Policies
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Pets allowed", checked: petsAllowed, set: setPetsAllowed },
              { label: "Parking", checked: parkingAvailable, set: setParkingAvailable },
              { label: "Fibre internet", checked: fibreAvailable, set: setFibreAvailable },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => p.set(!p.checked)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                  p.checked
                    ? "border-slate-800 bg-slate-800 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {(
          [
            ["Features", tagCatalogs.property_tags, propertyTags, setPropertyTags],
            ["Area", tagCatalogs.area_tags, areaTags, setAreaTags],
            ["Lifestyle", tagCatalogs.lifestyle_tags, lifestyleTags, setLifestyleTags],
          ] as const
        ).map(([label, catalog, selected, set]) => (
          <div key={label}>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              {label}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {catalog.map((tag) => (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => toggleTag(selected, set, tag.value)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    selected.includes(tag.value)
                      ? "border-slate-800 bg-slate-800 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-slate-200 pt-3">
        <button
          type="button"
          onClick={() => setShowTranscript((v) => !v)}
          className="text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          {showTranscript ? "Hide" : "Show"} original transcript
        </button>
        {showTranscript && (
          <div className="mt-2 space-y-2">
            <textarea
              className="input-field min-h-[80px] resize-y text-xs"
              value={editedTranscript}
              onChange={(e) => setEditedTranscript(e.target.value)}
            />
            <button
              type="button"
              onClick={() => onReanalyse(editedTranscript)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white"
            >
              Reanalyse transcript
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onStartOver}
          className="min-h-[44px] flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white"
        >
          Start over
        </button>
        {canContinueRecording && onContinueRecording && (
          <button
            type="button"
            onClick={onContinueRecording}
            className="min-h-[44px] flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white"
          >
            Continue recording
          </button>
        )}
        <button
          type="button"
          onClick={handleApply}
          className="min-h-[44px] flex-[2] rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          Apply details to form
        </button>
      </div>
    </div>
  );
}
