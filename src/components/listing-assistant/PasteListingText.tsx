"use client";

import { useState } from "react";
import { ListingAssistantReview } from "./ListingAssistantReview";
import type { PropertyDescriptionExtraction } from "@/lib/anthropic";
import type { ListingFormSnapshot, TagCatalogs } from "./types";

type Stage = "editing" | "extracting" | "review";

export function PasteListingText({
  formSnapshot,
  tagCatalogs,
  onApply,
  onCancel,
}: {
  formSnapshot: ListingFormSnapshot;
  tagCatalogs: TagCatalogs;
  onApply: (fields: Partial<ListingFormSnapshot>) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState("");
  const [stage, setStage] = useState<Stage>("editing");
  const [error, setError] = useState<string | null>(null);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [reviewData, setReviewData] = useState<PropertyDescriptionExtraction | null>(null);

  async function analyse(source: string) {
    const trimmed = source.trim();
    if (!trimmed) {
      setError("Paste your listing text first.");
      return;
    }
    setStage("extracting");
    setError(null);
    try {
      const res = await fetch("/api/properties/extract-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: trimmed, mode: "paste" }),
      });
      const json = await res.json();
      if (!res.ok) {
        console.log(
          "[listing-assistant] event=extraction_request_failure mode=paste",
        );
        setError(
          json.error ??
            "We couldn't process that text just now. It hasn't been lost, try again.",
        );
        setStage("editing");
        return;
      }
      const result = json.result as PropertyDescriptionExtraction;
      console.log(
        `[listing-assistant] event=${
          result.missing_fields.length === 0 ? "full_success" : "partial_success"
        } mode=paste`,
      );
      setFinalTranscript(trimmed);
      setReviewData(result);
      setStage("review");
    } catch {
      console.log("[listing-assistant] event=network_failure mode=paste");
      setError("Network error. Your text wasn't lost, try again.");
      setStage("editing");
    }
  }

  if (stage === "review" && reviewData) {
    return (
      <ListingAssistantReview
        extraction={reviewData}
        transcript={finalTranscript}
        currentForm={formSnapshot}
        tagCatalogs={tagCatalogs}
        canContinueRecording={false}
        onReanalyse={(newText) => void analyse(newText)}
        onApply={onApply}
        onStartOver={() => {
          setText("");
          setStage("editing");
          setReviewData(null);
        }}
      />
    );
  }

  return (
    <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Paste an existing listing
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Paste text from an ad you&apos;ve already written, we&apos;ll
            extract the details for you to review.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 text-xs font-medium text-slate-400 hover:text-slate-600"
        >
          Back
        </button>
      </div>

      <div className="mt-3 space-y-3">
        {error && <p className="text-sm text-red-700">{error}</p>}
        <textarea
          className="input-field min-h-[140px] resize-y text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your listing description here…"
          disabled={stage === "extracting"}
        />
        <button
          type="button"
          onClick={() => void analyse(text)}
          disabled={stage === "extracting"}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
        >
          {stage === "extracting" ? (
            <>
              <span className="motion-safe:animate-spin h-4 w-4 shrink-0 rounded-full border-2 border-white/40 border-t-white" />
              Analysing…
            </>
          ) : (
            "Analyse text"
          )}
        </button>
      </div>
    </div>
  );
}
