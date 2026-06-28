"use client";
import { useState, useEffect, useRef } from "react";

interface Props {
  tenantId: string;
  propertyId: string;
  tenantName: string;
  alreadyRequested: boolean;
}

export function IntroduceButton({
  tenantId,
  propertyId,
  tenantName,
  alreadyRequested,
}: Props) {
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">(
    alreadyRequested ? "sent" : "idle",
  );
  const [showInfo, setShowInfo] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const infoButtonRef = useRef<HTMLButtonElement>(null);
  const firstName = tenantName.split(" ")[0];

  useEffect(() => {
    if (!showInfo) return;
    function onMouseDown(e: MouseEvent) {
      if (
        popoverRef.current?.contains(e.target as Node) ||
        infoButtonRef.current?.contains(e.target as Node)
      )
        return;
      setShowInfo(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowInfo(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [showInfo]);

  async function handleClick() {
    if (state !== "idle" && state !== "error") return;
    setState("loading");
    try {
      const res = await fetch("/api/introductions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, property_id: propertyId }),
      });
      if (res.ok || res.status === 409) {
        setState("sent");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <svg
            className="h-4 w-4 shrink-0 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="text-sm font-semibold text-green-700">
            Invitation sent
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-green-600">
          {firstName} has been notified by email. If they&apos;re interested,
          they&apos;ll be in touch directly.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={handleClick}
          disabled={state === "loading"}
          className="flex-1 rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 active:scale-[0.98] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          {state === "loading"
            ? "Sending…"
            : state === "error"
              ? "Retry"
              : "Request Introduction"}
        </button>

        <button
          ref={infoButtonRef}
          type="button"
          onClick={() => setShowInfo((v) => !v)}
          aria-label="What is an introduction?"
          aria-expanded={showInfo}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      </div>

      {showInfo && (
        <div
          ref={popoverRef}
          role="tooltip"
          className="absolute bottom-full left-0 z-10 mb-2 w-64 rounded-xl border border-slate-200 bg-white p-3.5 shadow-lg"
        >
          <p className="text-xs font-semibold text-slate-900">
            What is an introduction?
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            Requesting an introduction notifies this tenant by email that
            you&apos;re interested in their profile. Their contact details
            aren&apos;t shared automatically — if they&apos;re interested,
            they&apos;ll reach out directly.
          </p>
        </div>
      )}
    </div>
  );
}
