"use client";

import { useState } from "react";
import {
  useSegmentedSpeechRecognition,
  SOFT_RECORDING_LIMIT_SECONDS,
} from "./useSegmentedSpeechRecognition";
import { ListingAssistantReview } from "./ListingAssistantReview";
import type { PropertyDescriptionExtraction } from "@/lib/anthropic";
import type { ListingFormSnapshot, TagCatalogs } from "./types";

const EXAMPLE =
  '"I’m listing a two-bedroom apartment in Vredehoek for R18,500 per month. It has one bathroom, secure parking and a balcony with mountain views. It is available from 1 September and would suit a professional couple."';

const SUGGESTION_CHIPS = [
  "Type & bedrooms",
  "Suburb",
  "Monthly rent",
  "Parking & security",
  "Pet policy",
  "What makes it special",
];

function fmtTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

type Stage = "capture" | "extracting" | "review";

export function VoiceQuickDescribe({
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
  const rec = useSegmentedSpeechRecognition();
  const [phase, setPhase] = useState<"intro" | "editing">("intro");
  const [stage, setStage] = useState<Stage>("capture");
  const [editableText, setEditableText] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [reviewData, setReviewData] = useState<PropertyDescriptionExtraction | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!rec.supported) return null;

  function handleFinish() {
    rec.finish((text) => {
      setEditableText(text);
      setPhase("editing");
      setError(
        text
          ? null
          : "Didn't catch anything, try recording again or type a few details below.",
      );
      if (!text) {
        console.log("[listing-assistant] event=no_transcript mode=quick");
      }
    });
  }

  async function analyse(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Add a few details before analysing, or try recording again.");
      return;
    }
    setStage("extracting");
    setError(null);
    try {
      const res = await fetch("/api/properties/extract-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: trimmed, mode: "voice" }),
      });
      const json = await res.json();
      if (!res.ok) {
        console.log(
          "[listing-assistant] event=extraction_request_failure mode=quick",
        );
        setError(
          json.error ??
            "We heard you, but couldn't process it just now. Your words are still here.",
        );
        setStage("capture");
        setPhase("editing");
        return;
      }
      const result = json.result as PropertyDescriptionExtraction;
      console.log(
        `[listing-assistant] event=${
          result.missing_fields.length === 0 ? "full_success" : "partial_success"
        } mode=quick`,
      );
      setFinalTranscript(trimmed);
      setReviewData(result);
      setStage("review");
    } catch {
      console.log("[listing-assistant] event=network_failure mode=quick");
      setError("Network error. Your description wasn't lost, try again.");
      setStage("capture");
      setPhase("editing");
    }
  }

  function cancelEverything() {
    rec.cancel();
    onCancel();
  }

  function continueRecordingFromReview() {
    setStage("capture");
    setPhase("editing");
    setEditableText(finalTranscript);
    rec.resume();
  }

  if (stage === "review" && reviewData) {
    return (
      <ListingAssistantReview
        extraction={reviewData}
        transcript={finalTranscript}
        currentForm={formSnapshot}
        tagCatalogs={tagCatalogs}
        canContinueRecording
        onContinueRecording={continueRecordingFromReview}
        onReanalyse={(text) => void analyse(text)}
        onApply={onApply}
        onStartOver={() => {
          rec.cancel();
          setStage("capture");
          setPhase("intro");
          setReviewData(null);
        }}
      />
    );
  }

  const audioBars = 5;

  return (
    <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Tell us about the property
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Speak naturally for about a minute, we&apos;ll fill in the
            details below for you to review.
          </p>
        </div>
        <button
          type="button"
          onClick={cancelEverything}
          className="shrink-0 text-xs font-medium text-slate-400 hover:text-slate-600"
        >
          Back
        </button>
      </div>

      {phase === "intro" && rec.state === "idle" && (
        <div className="mt-3 space-y-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs font-semibold text-slate-500">
              For example
            </p>
            <p className="mt-1 text-sm italic text-slate-600">{EXAMPLE}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTION_CHIPS.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-500"
              >
                {chip}
              </span>
            ))}
          </div>
          {rec.micPermission === "denied" && (
            <p className="text-sm text-red-700">
              Microphone access was blocked. You can still fill in the
              details manually below, or use &quot;Paste an existing
              listing&quot; instead.
            </p>
          )}
          <button
            type="button"
            onClick={rec.start}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Start recording
          </button>
        </div>
      )}

      {rec.state === "recording" && (
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="motion-safe:animate-pulse h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
              <p className="text-xs font-medium text-blue-700">Listening…</p>
            </div>
            <p className="font-mono text-xs text-slate-500">
              {fmtTime(rec.elapsedSeconds)}
            </p>
          </div>

          <div className="flex h-6 items-end justify-center gap-1">
            {Array.from({ length: audioBars }).map((_, i) => {
              const threshold = (i + 1) / audioBars;
              const active = rec.audioLevel >= threshold - 0.15;
              return (
                <span
                  key={i}
                  className={`w-1.5 rounded-full transition-all duration-100 ${
                    active ? "bg-blue-600" : "bg-slate-200"
                  }`}
                  style={{ height: `${8 + i * 4}px` }}
                />
              );
            })}
          </div>

          {rec.transcript && (
            <p className="max-h-32 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
              {rec.transcript}
            </p>
          )}

          {rec.elapsedSeconds >= SOFT_RECORDING_LIMIT_SECONDS && (
            <p className="text-xs text-slate-500">
              That&apos;s a great amount of detail, tap Finish whenever
              you&apos;re ready.
            </p>
          )}

          <p className="text-center text-xs text-slate-400">
            Your words are kept as you go, nothing is lost if you pause.
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={cancelEverything}
              className="min-h-[44px] flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={rec.pause}
              className="min-h-[44px] flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white"
            >
              Pause
            </button>
            <button
              type="button"
              onClick={handleFinish}
              className="min-h-[44px] flex-[2] rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Finish
            </button>
          </div>
        </div>
      )}

      {rec.state === "paused" && (
        <div className="mt-3 space-y-3">
          <p
            className={`text-sm font-medium ${
              rec.wasUnexpectedStop ? "text-amber-700" : "text-slate-600"
            }`}
          >
            {rec.wasUnexpectedStop
              ? "Recording paused. Nothing you've said so far is lost."
              : "Paused."}
          </p>
          {rec.transcript && (
            <p className="max-h-32 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
              {rec.transcript}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={cancelEverything}
              className="min-h-[44px] flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={rec.resume}
              className="min-h-[44px] flex-1 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Continue recording
            </button>
            <button
              type="button"
              onClick={handleFinish}
              className="min-h-[44px] flex-[2] rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Finish
            </button>
          </div>
        </div>
      )}

      {phase === "editing" && rec.state === "idle" && stage === "capture" && (
        <div className="mt-3 space-y-3">
          {error && <p className="text-sm text-red-700">{error}</p>}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              Review what we heard, edit anything before we fill in the form
            </label>
            <textarea
              className="input-field min-h-[100px] resize-y text-sm"
              value={editableText}
              onChange={(e) => setEditableText(e.target.value)}
              placeholder="Type or record a description of the property…"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={cancelEverything}
              className="min-h-[44px] flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white"
            >
              Start over
            </button>
            <button
              type="button"
              onClick={rec.resume}
              className="min-h-[44px] flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white"
            >
              Record more
            </button>
            <button
              type="button"
              onClick={() => void analyse(editableText)}
              className="min-h-[44px] flex-[2] rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Analyse
            </button>
          </div>
        </div>
      )}

      {stage === "extracting" && (
        <div className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          <span className="motion-safe:animate-spin h-4 w-4 shrink-0 rounded-full border-2 border-slate-300 border-t-blue-700" />
          Filling in the details…
        </div>
      )}
    </div>
  );
}
