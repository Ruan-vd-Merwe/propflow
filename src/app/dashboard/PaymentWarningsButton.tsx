"use client";
import { useState } from "react";

interface Props {
  /** Number of tenants with at least one overdue unpaid payment */
  overdueCount: number;
  /** Number of payments in the ±3/0/+3/+7/+14 day trigger window (may still be deduped) */
  warningWindowCount: number;
}

interface ApiResult {
  sent: number;
  skipped: number;
  failed: number;
  total: number;
}

type ToastState = {
  message: string;
  detail?: string;
  kind: "success" | "warn" | "error";
} | null;

export function PaymentWarningsButton({
  overdueCount,
  warningWindowCount,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  function showToast(t: NonNullable<ToastState>) {
    setToast(t);
    setTimeout(() => setToast(null), 6000);
  }

  async function handleSend() {
    if (loading) return;
    setLoading(true);
    setToast(null);

    try {
      const res = await fetch("/api/payment-warnings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "Unknown error");
        throw new Error(body);
      }

      const data: ApiResult = await res.json();

      if (data.sent === 0 && data.failed === 0) {
        showToast({
          message: "All caught up",
          detail:
            data.skipped > 0
              ? `${data.skipped} warning${data.skipped !== 1 ? "s" : ""} already sent today.`
              : "No warnings due right now.",
          kind: "success",
        });
      } else if (data.failed > 0 && data.sent === 0) {
        showToast({
          message: `${data.failed} email${data.failed !== 1 ? "s" : ""} failed to send`,
          detail: "Check your Resend API key in .env.local",
          kind: "error",
        });
      } else {
        showToast({
          message: `${data.sent} warning email${data.sent !== 1 ? "s" : ""} sent`,
          detail: data.failed > 0 ? `${data.failed} failed` : undefined,
          kind: data.failed > 0 ? "warn" : "success",
        });
      }
    } catch (err) {
      showToast({
        message: "Failed to reach the server",
        detail: err instanceof Error ? err.message : undefined,
        kind: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  const toastCls: Record<NonNullable<ToastState>["kind"], string> = {
    success: "bg-emerald-600 text-white",
    warn: "bg-amber-500 text-white",
    error: "bg-red-600 text-white",
  };

  return (
    <div className="relative inline-block">
      {/* Button */}
      <button
        onClick={handleSend}
        disabled={loading}
        title={
          warningWindowCount > 0
            ? `${warningWindowCount} payment${warningWindowCount !== 1 ? "s" : ""} in warning window`
            : "No payments in warning window"
        }
        className={`
          flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium
          transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60
          ${
            overdueCount > 0
              ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }
        `}
      >
        {loading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Sending…</span>
          </>
        ) : (
          <>
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span>Send Payment Warnings</span>
            {overdueCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-600 px-1.5 text-xs font-bold text-white tabular-nums">
                {overdueCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`
            absolute left-0 top-full z-50 mt-2 w-64 rounded-xl px-4 py-3 shadow-xl
            ${toastCls[toast.kind]}
          `}
        >
          <div className="flex items-start gap-2">
            {toast.kind === "success" && (
              <svg
                className="mt-0.5 h-4 w-4 shrink-0"
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
            )}
            {toast.kind === "error" && (
              <svg
                className="mt-0.5 h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            {toast.kind === "warn" && (
              <svg
                className="mt-0.5 h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
            )}
            <div>
              <p className="text-sm font-semibold leading-tight">
                {toast.message}
              </p>
              {toast.detail && (
                <p className="mt-0.5 text-xs opacity-80">{toast.detail}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
