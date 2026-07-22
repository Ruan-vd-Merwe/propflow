"use client";

import { useState } from "react";
import { useSegmentedSpeechRecognition } from "./useSegmentedSpeechRecognition";
import { ListingAssistantReview } from "./ListingAssistantReview";
import type { PropertyDescriptionExtraction } from "@/lib/anthropic";
import type { ListingFormSnapshot, TagCatalogs } from "./types";

const QUESTIONS: { prompt: string; placeholder: string }[] = [
  { prompt: "What type of property is it?", placeholder: "e.g. apartment, house, townhouse, room" },
  { prompt: "What area or suburb is it in?", placeholder: "e.g. Vredehoek" },
  { prompt: "How many bedrooms?", placeholder: "e.g. 2" },
  { prompt: "How many bathrooms?", placeholder: "e.g. 1" },
  { prompt: "What's the monthly rent?", placeholder: "e.g. R18,500" },
  { prompt: "What deposit are you asking for?", placeholder: "e.g. one month's rent" },
  { prompt: "When is it available from?", placeholder: "e.g. 1 September" },
  { prompt: "Is there parking?", placeholder: "e.g. secure off-street parking" },
  { prompt: "What's your pet policy?", placeholder: "e.g. pets welcome" },
  { prompt: "Any important features?", placeholder: "e.g. pool, garden, fibre, security" },
  { prompt: "What do you like most about this property?", placeholder: "e.g. the mountain view from the balcony" },
];

function IconMic({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
    </svg>
  );
}

type Stage = "asking" | "extracting" | "review";

export function VoiceGuidedQA({
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
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(() => QUESTIONS.map(() => ""));
  const [stage, setStage] = useState<Stage>("asking");
  const [error, setError] = useState<string | null>(null);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [reviewData, setReviewData] = useState<PropertyDescriptionExtraction | null>(null);

  const q = QUESTIONS[index];
  const isLast = index === QUESTIONS.length - 1;
  const liveValue =
    rec.state === "recording"
      ? [answers[index], rec.transcript].filter(Boolean).join(" ")
      : answers[index];

  function setAnswer(text: string) {
    setAnswers((prev) => prev.map((a, i) => (i === index ? text : a)));
  }

  function toggleMic() {
    if (rec.state === "idle") {
      rec.start();
    } else if (rec.state === "recording") {
      rec.finish((text) => {
        if (text) setAnswer([answers[index], text].filter(Boolean).join(" "));
      });
    } else if (rec.state === "paused") {
      rec.resume();
    }
  }

  function goTo(i: number) {
    if (rec.state !== "idle") rec.cancel();
    setError(null);
    setIndex(i);
  }

  function next() {
    if (isLast) {
      void submit();
    } else {
      goTo(index + 1);
    }
  }
  function back() {
    if (index === 0) return;
    goTo(index - 1);
  }
  function skip() {
    if (rec.state !== "idle") rec.cancel();
    next();
  }

  function buildTranscript(): string {
    return QUESTIONS.map((qq, i) => {
      const a = answers[i].trim();
      return a ? `${qq.prompt} ${a}` : null;
    })
      .filter(Boolean)
      .join(" ");
  }

  async function submit() {
    const transcript = buildTranscript();
    if (!transcript) {
      setError("Answer at least one question, or try a different entry method.");
      return;
    }
    await runExtraction(transcript);
  }

  async function runExtraction(transcript: string) {
    setStage("extracting");
    setError(null);
    try {
      const res = await fetch("/api/properties/extract-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, mode: "voice" }),
      });
      const json = await res.json();
      if (!res.ok) {
        console.log(
          "[listing-assistant] event=extraction_request_failure mode=guided",
        );
        setError(
          json.error ??
            "We heard your answers, but couldn't process them just now.",
        );
        setStage("asking");
        setIndex(QUESTIONS.length - 1);
        return;
      }
      const result = json.result as PropertyDescriptionExtraction;
      console.log(
        `[listing-assistant] event=${
          result.missing_fields.length === 0 ? "full_success" : "partial_success"
        } mode=guided`,
      );
      setFinalTranscript(transcript);
      setReviewData(result);
      setStage("review");
    } catch {
      console.log("[listing-assistant] event=network_failure mode=guided");
      setError("Network error. Your answers weren't lost, try again.");
      setStage("asking");
      setIndex(QUESTIONS.length - 1);
    }
  }

  function cancelEverything() {
    rec.cancel();
    onCancel();
  }

  if (stage === "review" && reviewData) {
    return (
      <ListingAssistantReview
        extraction={reviewData}
        transcript={finalTranscript}
        currentForm={formSnapshot}
        tagCatalogs={tagCatalogs}
        canContinueRecording={false}
        onReanalyse={(text) => void runExtraction(text)}
        onApply={onApply}
        onStartOver={() => {
          rec.cancel();
          setAnswers(QUESTIONS.map(() => ""));
          setIndex(0);
          setStage("asking");
          setReviewData(null);
        }}
      />
    );
  }

  if (stage === "extracting") {
    return (
      <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          <span className="motion-safe:animate-spin h-4 w-4 shrink-0 rounded-full border-2 border-slate-300 border-t-blue-700" />
          Filling in the details…
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Guide me through it
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Question {index + 1} of {QUESTIONS.length}
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

      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-300"
          style={{ width: `${((index + 1) / QUESTIONS.length) * 100}%` }}
        />
      </div>

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

      <p className="mt-3 text-sm font-semibold text-slate-900">{q.prompt}</p>

      {rec.micPermission === "denied" && (
        <p className="mt-1 text-xs text-red-700">
          Microphone access was blocked, type your answer instead.
        </p>
      )}
      {rec.state === "paused" && rec.wasUnexpectedStop && (
        <p className="mt-1 text-xs text-amber-700">
          Recording paused, nothing you&apos;ve said is lost. Tap the mic to
          continue.
        </p>
      )}

      <div className="mt-2 flex items-start gap-2">
        <textarea
          className="input-field min-h-[44px] flex-1 resize-y text-sm"
          value={liveValue}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder={q.placeholder}
        />
        <button
          type="button"
          onClick={toggleMic}
          aria-label={rec.state === "recording" ? "Stop recording" : "Record answer"}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition ${
            rec.state === "recording"
              ? "border-blue-700 bg-blue-700 text-white motion-safe:animate-pulse"
              : "border-slate-200 bg-white text-blue-700 hover:border-blue-300"
          }`}
        >
          <IconMic className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={back}
          disabled={index === 0}
          className="min-h-[44px] flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          onClick={skip}
          className="min-h-[44px] flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={next}
          className="min-h-[44px] flex-[2] rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          {isLast ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}
