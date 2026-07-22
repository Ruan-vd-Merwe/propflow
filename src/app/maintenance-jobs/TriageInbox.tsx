"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { JobUrgency, QueryCategory } from "@/lib/types";

export type TriageItem = {
  id: string;
  category: QueryCategory;
  title: string;
  description: string;
  created_at: string;
  tenantName: string;
  propertyName: string;
  propertyId: string;
};

export type ComponentOption = { id: string; name: string };

const CATEGORY_CONFIG: Record<QueryCategory, { label: string; badge: string }> = {
  emergency: { label: "Emergency", badge: "bg-red-100 text-red-700" },
  maintenance: { label: "Maintenance", badge: "bg-amber-100 text-amber-700" },
  general: { label: "General", badge: "bg-slate-100 text-slate-600" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function defaultUrgency(category: QueryCategory): JobUrgency {
  return category === "emergency" ? "urgent" : "normal";
}

export function TriageInbox({
  items,
  componentsByProperty,
}: {
  items: TriageItem[];
  componentsByProperty: Record<string, ComponentOption[]>;
}) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);

  const visible = items.filter((i) => !dismissed.has(i.id));
  if (visible.length === 0) return null;

  return (
    <div className="card mb-6 overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="font-semibold text-slate-900">Needs triage</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Tenant reports and check-in flags not yet turned into a job.
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {visible.map((item) => {
          const cat = CATEGORY_CONFIG[item.category];
          const isOpen = openId === item.id;
          const components = componentsByProperty[item.propertyId] ?? [];

          return (
            <div key={item.id} className="px-6 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${cat.badge}`}
                    >
                      {cat.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {item.tenantName} · {item.propertyName} ·{" "}
                    {formatDate(item.created_at)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  className="shrink-0 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {isOpen ? "Cancel" : "Convert to job"}
                </button>
              </div>

              {isOpen && (
                <ConvertForm
                  item={item}
                  components={components}
                  onConverted={(jobId) => {
                    setDismissed((s) => new Set(s).add(item.id));
                    router.push(`/maintenance-jobs/${jobId}`);
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConvertForm({
  item,
  components,
  onConverted,
}: {
  item: TriageItem;
  components: ComponentOption[];
  onConverted: (jobId: string) => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [urgency, setUrgency] = useState<JobUrgency>(
    defaultUrgency(item.category),
  );
  const [componentId, setComponentId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/tenant-queries/${item.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          urgency,
          component_id: componentId || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not convert this into a job");
        return;
      }
      onConverted(json.job_id);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Job title
          </label>
          <input
            className="input-field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Job description
          </label>
          <textarea
            className="input-field resize-none"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Urgency
            </label>
            <select
              className="input-field bg-white"
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as JobUrgency)}
            >
              <option value="urgent">Urgent</option>
              <option value="normal">Normal</option>
              <option value="planned">Planned</option>
            </select>
          </div>
          {components.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Link to component (optional)
              </label>
              <select
                className="input-field bg-white"
                value={componentId}
                onChange={(e) => setComponentId(e.target.value)}
              >
                <option value="">None</option>
                {components.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="button"
          disabled={submitting || !title.trim() || !description.trim()}
          onClick={submit}
          className="btn-primary"
        >
          {submitting ? "Creating job…" : "Create job"}
        </button>
      </div>
    </div>
  );
}
