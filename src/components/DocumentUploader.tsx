"use client";

import { useRef, useState } from "react";

export interface UploadedDoc {
  id: string;
  file_url: string;
  file_name: string;
}

export interface DocumentUploaderProps {
  documentType: string;
  tenantId?: string;
  propertyId?: string;
  onUploadComplete?: (doc: UploadedDoc) => void;
  label?: string;
  description?: string;
  endpoint?: string;
  extraFields?: Record<string, string>;
}

function IconCloud({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
      />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  );
}

function IconFile({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentUploader({
  documentType,
  tenantId,
  propertyId,
  onUploadComplete,
  label = "Upload document",
  description = "PDF, JPG, PNG or Word · Max 10MB",
  endpoint = "/api/documents/upload",
  extraFields,
}: DocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<UploadedDoc | null>(null);
  const [error, setError] = useState<string | null>(null);

  function pickFile(f: File) {
    setFile(f);
    setError(null);
    setUploaded(null);
    setProgress(0);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  }

  async function upload() {
    if (!file) return;
    setUploading(true);
    setError(null);

    // Fake progress 0 → 90%
    const interval = setInterval(() => {
      setProgress((p) => (p < 90 ? p + 10 : p));
    }, 200);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("document_type", documentType);
      if (tenantId) form.append("tenant_id", tenantId);
      if (propertyId) form.append("property_id", propertyId);
      if (extraFields) {
        Object.entries(extraFields).forEach(([k, v]) => form.append(k, v));
      }

      const res = await fetch(endpoint, { method: "POST", body: form });
      const json = await res.json();

      clearInterval(interval);

      if (!res.ok) {
        setError(json.error ?? "Upload failed");
        setUploading(false);
        setProgress(0);
        return;
      }

      setProgress(100);
      setUploaded(json);
      setUploading(false);
      onUploadComplete?.(json);
    } catch {
      clearInterval(interval);
      setError("Network error. Please try again.");
      setUploading(false);
      setProgress(0);
    }
  }

  if (uploaded) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500">
            <IconCheck className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-emerald-800">
              {uploaded.file_name}
            </p>
            <a
              href={uploaded.file_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-emerald-600 hover:underline"
            >
              View file
            </a>
          </div>
        </div>
        <button
          onClick={() => {
            setUploaded(null);
            setFile(null);
            setProgress(0);
          }}
          className="mt-3 w-full rounded-lg border border-emerald-300 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
        >
          Upload another
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onClick={() => !file && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition ${
          dragging
            ? "border-blue-400 bg-blue-50"
            : file
              ? "border-slate-200 bg-slate-50"
              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <IconFile className="h-8 w-8 shrink-0 text-slate-400" />
            <div className="text-left">
              <p className="text-sm font-medium text-slate-800">{file.name}</p>
              <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
            </div>
          </div>
        ) : (
          <>
            <IconCloud className="mx-auto mb-2 h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">{label}</p>
            <p className="mt-0.5 text-xs text-slate-400">
              Drop your file here or click to browse
            </p>
            <p className="mt-1 text-xs text-slate-400">{description}</p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) pickFile(f);
        }}
      />

      {/* Progress bar */}
      {uploading && (
        <div>
          <div className="mb-1 flex justify-between text-xs text-slate-500">
            <span>Uploading…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Actions */}
      {file && !uploading && (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setFile(null);
              setError(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Remove
          </button>
          <button
            onClick={upload}
            className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Upload
          </button>
        </div>
      )}
    </div>
  );
}
