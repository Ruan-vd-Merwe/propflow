"use client";

import { useEffect, useRef, useState } from "react";
import type { PropertyDescriptionExtraction } from "@/lib/anthropic";

// The Web Speech API isn't part of TypeScript's default DOM lib, so we
// declare the minimal shape this component actually uses rather than
// reaching for `any` throughout.
interface MinimalSpeechRecognitionAlternative {
  transcript: string;
}
interface MinimalSpeechRecognitionResult {
  0: MinimalSpeechRecognitionAlternative;
  isFinal: boolean;
}
interface MinimalSpeechRecognitionEvent {
  resultIndex: number;
  results: ArrayLike<MinimalSpeechRecognitionResult>;
}
interface MinimalSpeechRecognitionErrorEvent {
  error: string;
}
interface MinimalSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: MinimalSpeechRecognitionEvent) => void) | null;
  onerror: ((e: MinimalSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionConstructor = new () => MinimalSpeechRecognition;
interface SpeechRecognitionWindow {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

function getRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as SpeechRecognitionWindow;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function IconMic({ className }: { className?: string }) {
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
        d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
      />
    </svg>
  );
}

type RecState = "idle" | "recording" | "processing" | "error";

export function VoiceDescribeProperty({
  onExtracted,
}: {
  onExtracted: (fields: PropertyDescriptionExtraction) => void;
}) {
  const [supported, setSupported] = useState(false);
  const [state, setState] = useState<RecState>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null);
  const finalTranscriptRef = useRef("");

  useEffect(() => {
    setSupported(!!getRecognitionCtor());
  }, []);

  function startRecording() {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;

    setError(null);
    finalTranscriptRef.current = "";
    setTranscript("");

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-ZA";

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscriptRef.current += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript(finalTranscriptRef.current + interim);
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech") return;
      setError(
        event.error === "not-allowed" || event.error === "permission-denied"
          ? "Microphone access was blocked. You can still fill in the details manually below."
          : "Something went wrong with voice recording. You can try again or fill in manually.",
      );
      setState("error");
    };

    recognition.onend = () => {
      setState((s) => (s === "recording" ? "idle" : s));
    };

    recognitionRef.current = recognition;
    recognition.start();
    setState("recording");
  }

  function cancelRecording() {
    recognitionRef.current?.stop();
    finalTranscriptRef.current = "";
    setTranscript("");
    setState("idle");
  }

  function stopAndExtract() {
    recognitionRef.current?.stop();
    const finalText = finalTranscriptRef.current.trim();
    if (!finalText) {
      setState("idle");
      setError("Didn't catch anything, try again.");
      return;
    }
    void extract(finalText);
  }

  async function extract(text: string) {
    setState("processing");
    setError(null);
    try {
      const res = await fetch("/api/properties/extract-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(
          json.error ??
            "Could not process your description. You can try again or fill in manually.",
        );
        setState("error");
        return;
      }
      onExtracted(json.result as PropertyDescriptionExtraction);
      finalTranscriptRef.current = "";
      setTranscript("");
      setState("idle");
    } catch {
      setError("Network error. Your description wasn't lost, try again.");
      setState("error");
    }
  }

  if (!supported) return null;

  const hasRetryableTranscript = finalTranscriptRef.current.trim().length > 0;

  return (
    <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Describe your property
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Talk through the property and we&apos;ll fill in the details
            below for you to review.
          </p>
        </div>
      </div>

      {state === "idle" && (
        <button
          type="button"
          onClick={startRecording}
          className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          <IconMic className="h-5 w-5" />
          Describe your property
        </button>
      )}

      {state === "recording" && (
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-2">
            <span className="motion-safe:animate-pulse h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
            <p className="text-xs font-medium text-blue-700">Listening…</p>
          </div>
          {transcript && (
            <p className="max-h-32 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
              {transcript}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={cancelRecording}
              className="min-h-[44px] flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={stopAndExtract}
              className="min-h-[44px] flex-[2] rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Stop &amp; fill in
            </button>
          </div>
        </div>
      )}

      {state === "processing" && (
        <div className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          <span className="motion-safe:animate-spin h-4 w-4 shrink-0 rounded-full border-2 border-slate-300 border-t-blue-700" />
          Filling in the details…
        </div>
      )}

      {state === "error" && (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-red-700">{error}</p>
          <div className="flex gap-2">
            {hasRetryableTranscript && (
              <button
                type="button"
                onClick={() => void extract(finalTranscriptRef.current.trim())}
                className="min-h-[44px] flex-1 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                Retry
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                finalTranscriptRef.current = "";
                setTranscript("");
                setError(null);
                setState("idle");
              }}
              className="min-h-[44px] flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
