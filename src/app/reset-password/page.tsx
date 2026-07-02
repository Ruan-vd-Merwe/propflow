"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Status = "checking" | "ready" | "submitting" | "success" | "expired";

export default function ResetPasswordPage() {
  const router = useRouter();

  const supabase = useMemo(() => createClient(), []);

  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // Listen for PASSWORD_RECOVERY event FIRST before anything else —
    // this fires when Supabase processes the hash token from the email link.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setStatus("ready");
      }
    });

    async function init() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      // Supabase sends hash-encoded errors when the OTP was already used/expired
      // (e.g. #error=access_denied&error_code=otp_expired after a scanner prefetch)
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const hashErrorCode = hashParams.get("error_code");

      if (process.env.NODE_ENV === "development") {
        console.debug("[reset-password]", {
          hasCode: !!code,
          hasHash: window.location.hash.length > 1,
          hashErrorCode: hashErrorCode ?? null,
        });
      }

      if (hashErrorCode) {
        window.history.replaceState({}, "", "/reset-password");
        if (mounted) setStatus("expired");
        return;
      }

      // PKCE flow: exchange the one-time code for a recovery session
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        // Strip the code from the URL immediately — prevents re-use on refresh
        window.history.replaceState({}, "", "/reset-password");
        if (process.env.NODE_ENV === "development") {
          console.debug("[reset-password] exchangeCodeForSession:", error ? error.message : "ok");
        }
        if (!error) {
          // onAuthStateChange will also fire PASSWORD_RECOVERY, but set ready
          // here immediately so the form appears without waiting for the event
          if (mounted) setStatus("ready");
          return;
        }
        // Exchange failed (code expired, already used, or verifier mismatch)
        if (mounted) setStatus("expired");
        return;
      }

      // No code — check for an existing recovery session (e.g. after page refresh)
      const { data } = await supabase.auth.getSession();
      if (process.env.NODE_ENV === "development") {
        console.debug("[reset-password] getSession; sessionFound:", !!data.session);
      }
      if (!mounted) return;
      if (data.session) {
        setStatus("ready");
        return;
      }

      // Last-resort timeout: give onAuthStateChange time to fire PASSWORD_RECOVERY
      // in case the Supabase client processes a hash token asynchronously
      setTimeout(() => {
        if (!mounted) return;
        setStatus((prev) => (prev === "checking" ? "expired" : prev));
      }, 2000);
    }

    init();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setStatus("submitting");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("ready");
      setError(error.message);
      return;
    }

    setStatus("success");
    await supabase.auth.signOut();

    setTimeout(() => {
      router.push("/login?reset=success");
    }, 2000);
  }

  if (status === "checking") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
        }}
      >
        <p style={{ color: "#64748b", fontSize: 15 }}>
          Verifying your reset link...
        </p>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: "100%",
            background: "white",
            borderRadius: 16,
            padding: 40,
            border: "1px solid #e2e8f0",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: 12,
            }}
          >
            This link has expired
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#64748b",
              lineHeight: 1.6,
              marginBottom: 28,
            }}
          >
            Password reset links expire after 1 hour or after they have been
            used once. Request a new one below.
          </p>
          <Link
            href="/forgot-password"
            style={{
              display: "block",
              padding: "13px 0",
              background: "#1e40af",
              color: "white",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 15,
              textDecoration: "none",
              marginBottom: 12,
            }}
          >
            Request a new reset link
          </Link>
          <Link
            href="/login"
            style={{
              display: "block",
              fontSize: 14,
              color: "#64748b",
              textDecoration: "none",
            }}
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: "100%",
            background: "white",
            borderRadius: 16,
            padding: 40,
            border: "1px solid #e2e8f0",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              background: "#dcfce7",
              borderRadius: 99,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="#16a34a"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: 8,
            }}
          >
            Password updated
          </h1>
          <p style={{ fontSize: 14, color: "#64748b" }}>
            Redirecting you to sign in...
          </p>
        </div>
      </div>
    );
  }

  // ready or submitting — show the form
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: "100%",
          background: "white",
          borderRadius: 16,
          padding: 40,
          border: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 18, color: "#0f172a" }}>
            PropTrust
          </span>
        </div>

        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: 8,
          }}
        >
          Set a new password
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#64748b",
            marginBottom: 28,
            lineHeight: 1.6,
          }}
        >
          Choose a strong password for your account.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 6,
              }}
            >
              New password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              required
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: 8,
                border: "1.5px solid #e2e8f0",
                fontSize: 15,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 6,
              }}
            >
              Confirm new password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your password"
              autoComplete="new-password"
              required
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: 8,
                border: "1.5px solid #e2e8f0",
                fontSize: 15,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 13,
                color: "#dc2626",
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "submitting" || !password || !confirm}
            style={{
              width: "100%",
              padding: "13px 0",
              background: "#1e40af",
              color: "white",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 16,
              border: "none",
              cursor:
                status === "submitting" ? "not-allowed" : "pointer",
              opacity:
                status === "submitting" || !password || !confirm ? 0.6 : 1,
            }}
          >
            {status === "submitting" ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
