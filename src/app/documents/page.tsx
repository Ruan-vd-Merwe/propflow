"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { NavBar } from "@/components/NavBar";
import { DocumentUploader } from "@/components/DocumentUploader";

// ─── Types ────────────────────────────────────────────────────────────────────

type Document = {
  id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  notes: string | null;
  created_at: string;
  tenant_id: string | null;
  property_id: string | null;
};

type Tenant = { id: string; full_name: string };
type Property = { id: string; name: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const DOC_TYPES = [
  { value: "id_document", label: "ID Document", colour: "bg-blue-100 text-blue-700" },
  { value: "bank_statement", label: "Bank Statement", colour: "bg-green-100 text-green-700" },
  { value: "lease_agreement", label: "Lease Agreement", colour: "bg-navy-100 text-indigo-700" },
  { value: "proof_of_income", label: "Proof of Income", colour: "bg-amber-100 text-amber-700" },
  { value: "inspection_report", label: "Inspection Report", colour: "bg-purple-100 text-purple-700" },
  { value: "other", label: "Other", colour: "bg-slate-100 text-slate-600" },
] as const;

type DocTypeValue = (typeof DOC_TYPES)[number]["value"];

const TABS = [
  { id: "all", label: "All" },
  { id: "id_document", label: "ID Documents" },
  { id: "bank_statement", label: "Bank Statements" },
  { id: "lease_agreement", label: "Leases" },
  { id: "inspection_report", label: "Inspections" },
  { id: "other", label: "Other" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function docTypeMeta(type: string) {
  return DOC_TYPES.find((d) => d.value === type) ?? DOC_TYPES[DOC_TYPES.length - 1];
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function FileTypeIcon({ mime }: { mime: string | null }) {
  if (mime?.includes("pdf")) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
        <span className="text-xs font-bold text-red-600">PDF</span>
      </div>
    );
  }
  if (mime?.startsWith("image/")) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
        <span className="text-xs font-bold text-blue-600">IMG</span>
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
      <span className="text-xs font-bold text-slate-500">DOC</span>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconUpload() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
    </svg>
  );
}

function IconFolderOpen() {
  return (
    <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
    </svg>
  );
}

function IconX() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// ─── Upload modal ─────────────────────────────────────────────────────────────

function UploadModal({
  tenants,
  properties,
  onClose,
  onSuccess,
}: {
  tenants: Tenant[];
  properties: Property[];
  onClose: () => void;
  onSuccess: (doc: Document) => void;
}) {
  const [docType, setDocType] = useState<DocTypeValue>("id_document");
  const [tenantId, setTenantId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [notes, setNotes] = useState("");
  const [toast, setToast] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 z-40 flex items-end justify-end bg-slate-900/30 sm:items-start"
    >
      {toast && (
        <div className="fixed inset-x-0 top-4 z-50 flex justify-center">
          <div className="rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-lg">
            Document uploaded successfully
          </div>
        </div>
      )}
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl sm:border-l sm:border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-900">Upload document</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <IconX />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              Document type <span className="text-red-500">*</span>
            </label>
            <select
              className="input-field"
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocTypeValue)}
            >
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {tenants.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                For tenant (optional)
              </label>
              <select
                className="input-field"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
              >
                <option value="">— None —</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {properties.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                For property (optional)
              </label>
              <select
                className="input-field"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
              >
                <option value="">— None —</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              Notes (optional)
            </label>
            <textarea
              className="input-field resize-none"
              rows={2}
              placeholder="Any notes about this document…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              File <span className="text-red-500">*</span>
            </label>
            <DocumentUploader
              documentType={docType}
              tenantId={tenantId || undefined}
              propertyId={propertyId || undefined}
              onUploadComplete={(doc) => {
                onSuccess({
                  ...doc,
                  document_type: docType,
                  file_size: null,
                  mime_type: null,
                  notes: notes || null,
                  created_at: new Date().toISOString(),
                  tenant_id: tenantId || null,
                  property_id: propertyId || null,
                });
                setToast(true);
                setTimeout(() => {
                  setToast(false);
                  onClose();
                }, 1500);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const [docsRes, tenantsRes, propsRes] = await Promise.all([
        supabase
          .from("documents")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("tenants")
          .select("id, full_name")
          .order("full_name"),
        supabase
          .from("properties")
          .select("id, name")
          .eq("owner_id", user.id)
          .order("name"),
      ]);

      setDocuments((docsRes.data as Document[]) ?? []);
      setTenants((tenantsRes.data as Tenant[]) ?? []);
      setProperties((propsRes.data as Property[]) ?? []);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generateSignedUrl(doc: Document): Promise<string> {
    const { data } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.file_url, 3600);
    return data?.signedUrl ?? doc.file_url;
  }

  async function handleView(doc: Document) {
    const url = await generateSignedUrl(doc);
    window.open(url, "_blank");
  }

  async function handleDelete(doc: Document) {
    if (!confirm(`Delete "${doc.file_name}"?`)) return;
    setDeleting(doc.id);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      }
    } finally {
      setDeleting(null);
    }
  }

  const filtered =
    activeTab === "all"
      ? documents
      : documents.filter((d) => d.document_type === activeTab);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavBar />
        <div className="flex items-center justify-center py-32">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
            <p className="mt-1 text-sm text-slate-500">
              Upload and manage your property documents
            </p>
          </div>
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <IconUpload />
            Upload document
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Document list */}
        {filtered.length === 0 ? (
          <div className="card flex flex-col items-center py-16 text-center">
            <div className="mb-4 text-slate-300">
              <IconFolderOpen />
            </div>
            <p className="font-semibold text-slate-600">No documents yet</p>
            <p className="mt-1 text-sm text-slate-400">
              Upload your first document to get started
            </p>
            <button
              onClick={() => setUploadOpen(true)}
              className="mt-4 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <IconUpload />
              Upload document
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="card hidden overflow-hidden sm:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      File name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Size
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Uploaded
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((doc) => {
                    const meta = docTypeMeta(doc.document_type);
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <FileTypeIcon mime={doc.mime_type} />
                            <span className="max-w-[200px] truncate text-sm font-medium text-slate-800">
                              {doc.file_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.colour}`}
                          >
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {formatSize(doc.file_size)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {formatDate(doc.created_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleView(doc)}
                              className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDelete(doc)}
                              disabled={deleting === doc.id}
                              className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            >
                              {deleting === doc.id ? "Deleting…" : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 sm:hidden">
              {filtered.map((doc) => {
                const meta = docTypeMeta(doc.document_type);
                return (
                  <div key={doc.id} className="card p-4">
                    <div className="flex items-start gap-3">
                      <FileTypeIcon mime={doc.mime_type} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {doc.file_name}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.colour}`}
                          >
                            {meta.label}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatSize(doc.file_size)}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatDate(doc.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleView(doc)}
                        className="flex-1 rounded-lg border border-slate-200 py-2 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(doc)}
                        disabled={deleting === doc.id}
                        className="flex-1 rounded-lg border border-slate-200 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {deleting === doc.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Upload modal */}
      {uploadOpen && (
        <UploadModal
          tenants={tenants}
          properties={properties}
          onClose={() => setUploadOpen(false)}
          onSuccess={(doc) => {
            setDocuments((prev) => [doc, ...prev]);
          }}
        />
      )}
    </div>
  );
}
