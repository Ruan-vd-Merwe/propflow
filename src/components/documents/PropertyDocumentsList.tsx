"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  type PropertyDocumentType,
  DOCUMENT_TYPE_LABELS,
  formatFileSize,
} from "@/lib/documents";

type PropertyDocument = {
  id: string;
  document_type: PropertyDocumentType;
  file_name: string;
  storage_path: string;
  storage_bucket: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  sha256_hex: string | null;
  notes: string | null;
  created_at: string;
};

type Props = {
  propertyId: string;
  ownerId: string;
  refreshKey?: number;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function MimeChip({ mime }: { mime: string | null }) {
  if (mime?.includes("pdf"))
    return (
      <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
        PDF
      </span>
    );
  if (mime?.startsWith("image/"))
    return (
      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
        IMG
      </span>
    );
  return (
    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
      DOC
    </span>
  );
}

export function PropertyDocumentsList({
  propertyId,
  ownerId,
  refreshKey = 0,
}: Props) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const supabase = createClient();
  const [docs, setDocs] = useState<PropertyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("property_documents")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false });
    setDocs((data as PropertyDocument[]) ?? []);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  async function handleView(doc: PropertyDocument) {
    setOpeningId(doc.id);
    try {
      const { data } = await supabase.storage
        .from(doc.storage_bucket)
        .createSignedUrl(doc.storage_path, 60);

      if (data?.signedUrl) {
        await supabase.from("document_access_log").insert({
          document_id: doc.id,
          accessed_by: ownerId,
          action: "view",
        });
        window.open(data.signedUrl, "_blank");
      }
    } finally {
      setOpeningId(null);
    }
  }

  async function handleDelete(doc: PropertyDocument) {
    if (!confirm(`Delete "${doc.file_name}"? This cannot be undone.`)) return;
    setDeleting(doc.id);
    try {
      await supabase.from("document_access_log").insert({
        document_id: doc.id,
        accessed_by: ownerId,
        action: "delete",
      });
      await supabase.storage
        .from(doc.storage_bucket)
        .remove([doc.storage_path]);
      await supabase.from("property_documents").delete().eq("id", doc.id);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
        <p className="text-sm text-slate-500">No documents uploaded yet.</p>
      </div>
    );
  }

  // Group by document type
  const groups = new Map<string, PropertyDocument[]>();
  for (const doc of docs) {
    if (!groups.has(doc.document_type)) groups.set(doc.document_type, []);
    groups.get(doc.document_type)!.push(doc);
  }

  return (
    <div className="space-y-6">
      {Array.from(groups.entries()).map(([type, typeDocs]) => (
        <div key={type}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {DOCUMENT_TYPE_LABELS[type as PropertyDocumentType] ?? type}
          </h3>
          <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {typeDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
              >
                <MimeChip mime={doc.mime_type} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {doc.file_name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatFileSize(doc.file_size_bytes)} &middot;{" "}
                    {formatDate(doc.created_at)}
                    {doc.notes ? ` · ${doc.notes}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => handleView(doc)}
                    disabled={openingId === doc.id}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50 disabled:opacity-50"
                  >
                    {openingId === doc.id ? "Opening…" : "View"}
                  </button>
                  <button
                    onClick={() => handleDelete(doc)}
                    disabled={deleting === doc.id}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    {deleting === doc.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
