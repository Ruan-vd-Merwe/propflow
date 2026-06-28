"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  type PropertyDocumentType,
  DOCUMENT_TYPE_LABELS,
  calculateSha256,
  formatFileSize,
  getDocumentBucket,
  isSensitiveDocumentType,
  sanitizeFilename,
} from "@/lib/documents";

type Props = {
  ownerId: string;
  propertyId: string;
  onSuccess: () => void;
};

const ALLOWED_MIME: readonly string[] = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_BYTES = 50 * 1024 * 1024;

const DOC_TYPES = Object.entries(DOCUMENT_TYPE_LABELS) as [
  PropertyDocumentType,
  string,
][];

export function SecureDocumentUploader({ ownerId, propertyId, onSuccess }: Props) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const [docType, setDocType] = useState<PropertyDocumentType>("inspection_report");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function validateFile(f: File): string | null {
    if (!ALLOWED_MIME.includes(f.type)) {
      return "File type not supported. Use PDF, JPG, PNG, WEBP or Word.";
    }
    if (f.size > MAX_BYTES) {
      return `File too large. Maximum ${formatFileSize(MAX_BYTES)}.`;
    }
    return null;
  }

  function handleFileSelect(f: File) {
    const err = validateFile(f);
    if (err) {
      setError(err);
      setFile(null);
    } else {
      setError(null);
      setFile(f);
    }
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const sha256 = await calculateSha256(arrayBuffer);
      const safeName = sanitizeFilename(file.name);
      const bucket = getDocumentBucket(docType);
      const storagePath = `${ownerId}/${propertyId}/${Date.now()}_${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, new Uint8Array(arrayBuffer), {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw new Error(uploadError.message);

      const { data: doc, error: dbError } = await supabase
        .from("property_documents")
        .insert({
          owner_id: ownerId,
          property_id: propertyId,
          document_type: docType,
          file_name: file.name,
          storage_path: storagePath,
          storage_bucket: bucket,
          file_size_bytes: file.size,
          mime_type: file.type,
          sha256_hex: sha256,
          notes: notes.trim() || null,
        })
        .select("id")
        .single();

      if (dbError) throw new Error(dbError.message);

      await supabase.from("document_access_log").insert({
        document_id: doc.id,
        accessed_by: ownerId,
        action: "upload",
      });

      setFile(null);
      setNotes("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const sensitive = isSensitiveDocumentType(docType);

  return (
    <div className="space-y-4">
      {/* Privacy notice */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
        Documents are stored in a private, access-controlled bucket. Only you can
        view or download your files. Files are never publicly accessible.
        POPIA-aligned data handling applies.{" "}
        <a href="/trust" className="underline underline-offset-2 hover:text-slate-700">
          Learn more
        </a>
        .
      </div>

      {/* Document type */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Document type <span className="text-red-500">*</span>
        </label>
        <select
          className="input-field"
          value={docType}
          onChange={(e) => setDocType(e.target.value as PropertyDocumentType)}
        >
          {DOC_TYPES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {sensitive && (
          <p className="mt-1.5 text-xs text-amber-700">
            This document type is sensitive and stored in a restricted private
            bucket with additional access controls.
          </p>
        )}
      </div>

      {/* Drop zone */}
      <div
        ref={dropRef}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const dropped = e.dataTransfer.files[0];
          if (dropped) handleFileSelect(dropped);
        }}
        className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${
          dragOver
            ? "border-blue-400 bg-blue-50"
            : file
              ? "border-green-400 bg-green-50"
              : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileSelect(f);
          }}
        />
        {file ? (
          <div>
            <p className="font-medium text-slate-800">{file.name}</p>
            <p className="mt-1 text-xs text-slate-400">{formatFileSize(file.size)}</p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-slate-600">
              Drop file here or click to browse
            </p>
            <p className="mt-1 text-xs text-slate-400">
              PDF, JPG, PNG, WEBP or Word — max 50 MB
            </p>
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Notes (optional)
        </label>
        <textarea
          className="input-field resize-none"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes about this document…"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="btn-primary w-full disabled:opacity-50"
      >
        {uploading ? "Uploading…" : "Upload document"}
      </button>
    </div>
  );
}
