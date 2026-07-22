"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// The Web Speech API isn't part of TypeScript's default DOM lib, so we
// declare the minimal shape actually used here rather than reaching for `any`.
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

export const SOFT_RECORDING_LIMIT_SECONDS = 60;

export type RecordingState = "idle" | "recording" | "paused";

export function useSegmentedSpeechRecognition() {
  const [supported, setSupported] = useState(false);
  const [state, setState] = useState<RecordingState>("idle");
  const [micPermission, setMicPermission] = useState<
    "unknown" | "denied"
  >("unknown");
  const [segments, setSegments] = useState<string[]>([]);
  const [interimText, setInterimText] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [wasUnexpectedStop, setWasUnexpectedStop] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null);
  const segmentsRef = useRef<string[]>([]);
  const pausedByUserRef = useRef(false);
  const finishedByUserRef = useRef(false);
  const permissionDeniedRef = useRef(false);
  const onFinishRef = useRef<((text: string) => void) | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setSupported(!!getRecognitionCtor());
    return () => {
      recognitionRef.current?.stop();
      stopAudioMeter();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state !== "recording") return;
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [state]);

  function joinSegments(): string {
    return segmentsRef.current.join(" ").trim();
  }

  function stopAudioMeter() {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setAudioLevel(0);
  }

  async function startAudioMeter() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAudioLevel(Math.min(1, avg / 160));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // Level meter is decorative — if we can't get a raw stream (blocked,
      // unsupported, already denied) we just skip the visual, the actual
      // recognition permission is handled separately via onerror below.
    }
  }

  const beginRecognition = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;

    void startAudioMeter();

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-ZA";

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const text = result[0].transcript.trim();
          if (text) {
            segmentsRef.current = [...segmentsRef.current, text];
            setSegments(segmentsRef.current);
          }
        } else {
          interim += result[0].transcript;
        }
      }
      setInterimText(interim);
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech") return;
      if (event.error === "not-allowed" || event.error === "permission-denied") {
        permissionDeniedRef.current = true;
        setMicPermission("denied");
      }
      // Other errors (network, aborted, audio-capture) fall through to
      // onend, which treats any stop that wasn't user-initiated as
      // "unexpected" and preserves everything captured so far.
    };

    recognition.onend = () => {
      stopAudioMeter();
      setInterimText("");
      recognitionRef.current = null;

      if (finishedByUserRef.current) {
        finishedByUserRef.current = false;
        permissionDeniedRef.current = false;
        setState("idle");
        const cb = onFinishRef.current;
        onFinishRef.current = null;
        cb?.(joinSegments());
        return;
      }

      if (permissionDeniedRef.current) {
        // Nothing useful can come from "continue recording" while access is
        // blocked — surface this distinctly from a generic engine stop and
        // drop back to idle so the caller shows the permission-denied state.
        permissionDeniedRef.current = false;
        pausedByUserRef.current = false;
        setWasUnexpectedStop(false);
        setState(segmentsRef.current.length > 0 ? "paused" : "idle");
        return;
      }

      if (pausedByUserRef.current) {
        pausedByUserRef.current = false;
        setWasUnexpectedStop(false);
        setState("paused");
        return;
      }

      // Neither pause nor finish was requested — the engine ended the
      // session on its own (silence timeout, duration cap, network hiccup).
      // Everything captured so far stays in `segments`; we surface this as
      // "paused" with a distinct flag rather than an error.
      setWasUnexpectedStop(true);
      setState("paused");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setState("recording");
  }, []);

  const start = useCallback(() => {
    segmentsRef.current = [];
    setSegments([]);
    setInterimText("");
    setElapsedSeconds(0);
    setWasUnexpectedStop(false);
    setMicPermission("unknown");
    beginRecognition();
  }, [beginRecognition]);

  const resume = useCallback(() => {
    setWasUnexpectedStop(false);
    setMicPermission("unknown");
    beginRecognition();
  }, [beginRecognition]);

  const pause = useCallback(() => {
    pausedByUserRef.current = true;
    recognitionRef.current?.stop();
  }, []);

  const finish = useCallback((onDone: (text: string) => void) => {
    if (!recognitionRef.current) {
      onDone(joinSegments());
      return;
    }
    finishedByUserRef.current = true;
    onFinishRef.current = onDone;
    recognitionRef.current.stop();
  }, []);

  const cancel = useCallback(() => {
    pausedByUserRef.current = false;
    finishedByUserRef.current = false;
    onFinishRef.current = null;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    stopAudioMeter();
    segmentsRef.current = [];
    setSegments([]);
    setInterimText("");
    setElapsedSeconds(0);
    setWasUnexpectedStop(false);
    setState("idle");
  }, []);

  const reset = useCallback(() => {
    segmentsRef.current = [];
    setSegments([]);
    setInterimText("");
    setElapsedSeconds(0);
    setWasUnexpectedStop(false);
  }, []);

  /** Lets the review screen apply manual edits back into the segment list. */
  const setTranscriptText = useCallback((text: string) => {
    segmentsRef.current = text ? [text] : [];
    setSegments(segmentsRef.current);
  }, []);

  return {
    supported,
    state,
    micPermission,
    segments,
    interimText,
    transcript: [...segments, interimText].filter(Boolean).join(" "),
    elapsedSeconds,
    wasUnexpectedStop,
    audioLevel,
    start,
    pause,
    resume,
    finish,
    cancel,
    reset,
    setTranscriptText,
  };
}
