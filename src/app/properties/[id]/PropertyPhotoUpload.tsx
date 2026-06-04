"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  propertyId: string;
  initialPhotos: string[];
}

export function PropertyPhotoUpload({ propertyId, initialPhotos }: Props) {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [pending, setPending] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const slots = 6 - photos.length;
    setPending((prev) => [...prev, ...files].slice(0, Math.max(slots, 0)));
    e.target.value = "";
  }

  function removePending(i: number) {
    setPending((prev) => prev.filter((_, idx) => idx !== i));
  }

  function removeUploaded(url: string) {
    setPhotos((prev) => prev.filter((u) => u !== url));
  }

  async function handleUpload() {
    if (pending.length === 0) return;
    setUploading(true);
    setError(null);

    const newUrls: string[] = [];
    for (const file of pending) {
      const path = `${propertyId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: upErr } = await supabase.storage
        .from("property-photos")
        .upload(path, file, { upsert: true });
      if (upErr) {
        setError(upErr.message);
        setUploading(false);
        return;
      }
      const { data } = supabase.storage
        .from("property-photos")
        .getPublicUrl(path);
      newUrls.push(data.publicUrl);
    }

    const updated = [...photos, ...newUrls];
    const { error: dbErr } = await supabase
      .from("properties")
      .update({ photos: updated })
      .eq("id", propertyId);

    if (dbErr) {
      setError(dbErr.message);
    } else {
      setPhotos(updated);
      setPending([]);
    }
    setUploading(false);
  }

  async function saveRemoved() {
    const { error: dbErr } = await supabase
      .from("properties")
      .update({ photos })
      .eq("id", propertyId);
    if (dbErr) setError(dbErr.message);
  }

  const totalSlots = 6;
  const used = photos.length + pending.length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">
          Photos{" "}
          <span className="text-slate-400">
            ({used}/{totalSlots})
          </span>
        </p>
        {pending.length > 0 && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {uploading
              ? "Uploading…"
              : `Upload ${pending.length} photo${pending.length > 1 ? "s" : ""}`}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Uploaded photos */}
        {photos.map((url, i) => (
          <div
            key={url}
            className="group relative h-24 w-24 overflow-hidden rounded-xl border border-slate-200"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Photo ${i + 1}`}
              className="h-full w-full object-cover"
            />
            <button
              onClick={() => {
                removeUploaded(url);
                saveRemoved();
              }}
              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100"
              title="Remove photo"
            >
              <svg
                className="h-5 w-5 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        ))}

        {/* Pending (local preview) */}
        {pending.map((file, i) => (
          <div
            key={i}
            className="group relative h-24 w-24 overflow-hidden rounded-xl border-2 border-dashed border-slate-400"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={URL.createObjectURL(file)}
              alt=""
              className="h-full w-full object-cover opacity-70"
            />
            <button
              onClick={() => removePending(i)}
              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100"
            >
              <svg
                className="h-5 w-5 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <span className="absolute bottom-1 left-0 right-0 text-center text-xs font-bold text-white drop-shadow">
              pending
            </span>
          </div>
        ))}

        {/* Add button */}
        {used < totalSlots && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-24 w-24 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 text-xs text-slate-400 transition hover:border-slate-400 hover:text-slate-600"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add photo
          </button>
        )}
      </div>

      {/* Hidden input — accept images + camera on mobile */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture={undefined}
        multiple
        className="hidden"
        onChange={handleSelect}
      />

      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
