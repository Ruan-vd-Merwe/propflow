"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
];
const PROPERTY_COUNTS = ["1-5", "6-20", "20+"];

type FlowStep = "personal" | "landlord-details";

function Logo() {
  return (
    <div className="mb-8 text-center">
      <h1 className="text-2xl font-bold text-slate-900">PropTrust</h1>
      <p className="mt-1 text-sm text-slate-500">Create your account</p>
    </div>
  );
}

function StepDots({ steps, current }: { steps: number; current: number }) {
  return (
    <div className="mb-6 flex items-center justify-center gap-2">
      {Array.from({ length: steps }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all ${
            i < current
              ? "w-4 bg-slate-400"
              : i === current
                ? "w-6 bg-blue-700"
                : "w-2 bg-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

export default function RegisterPage() {
  const supabase = createClient();

  // ── Role selection ─────────────────────────────────────────────────────────
  const [isLandlord, setIsLandlord] = useState(false);
  const [isTenant, setIsTenant] = useState(false);
  const [roleChosen, setRoleChosen] = useState(false);

  // ── Flow step ──────────────────────────────────────────────────────────────
  const [flowStepIdx, setFlowStepIdx] = useState(0);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupDone, setSignupDone] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");

  // ── Shared fields ──────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // ── Landlord fields ────────────────────────────────────────────────────────
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [propertyCount, setPropertyCount] = useState("");

  // ── Pre-select role from URL ──────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const role = params.get("role");
    if (role === "owner") setIsLandlord(true);
    if (role === "tenant") setIsTenant(true);
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function getFlowSteps(): FlowStep[] {
    const steps: FlowStep[] = ["personal"];
    if (isLandlord) steps.push("landlord-details");
    return steps;
  }

  const flowSteps = getFlowSteps();
  const totalDots = flowSteps.length; // for step-dots display
  const currentFlowStep = flowSteps[flowStepIdx];

  function advance() {
    if (flowStepIdx < flowSteps.length - 1) {
      setFlowStepIdx((i) => i + 1);
      setError(null);
    } else {
      handleSubmit();
    }
  }

  function back() {
    if (flowStepIdx > 0) {
      setFlowStepIdx((i) => i - 1);
      setError(null);
    } else {
      setRoleChosen(false);
      setFlowStepIdx(0);
    }
  }

  function parseSignUpError(msg: string): string {
    const m = msg.toLowerCase();
    if (
      m.includes("user already registered") ||
      m.includes("already been registered") ||
      m.includes("already registered")
    ) {
      return "An account with this email already exists. Try signing in or reset your password instead.";
    }
    if (
      m.includes("invalid email") ||
      m.includes("email address is invalid") ||
      m.includes("unable to validate email")
    ) {
      return "Please enter a valid email address.";
    }
    if (
      m.includes("password should be") ||
      m.includes("password must be") ||
      m.includes("too short")
    ) {
      return "Your password must be at least 8 characters.";
    }
    if (
      m.includes("sending email") ||
      m.includes("smtp") ||
      m.includes("email sending") ||
      m.includes("error sending") ||
      m.includes("failed to send")
    ) {
      return "We couldn't send your confirmation email right now. Please try again in a few minutes, or contact support@proptrust.co.za.";
    }
    if (
      m.includes("invalid redirect") ||
      m.includes("redirect_to") ||
      m.includes("unauthorized")
    ) {
      return "Signup is temporarily unavailable. Please try again later or contact support@proptrust.co.za.";
    }
    if (m.includes("rate limit") || m.includes("too many requests")) {
      return "Too many signup attempts. Please wait a few minutes and try again.";
    }
    return msg;
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    const metadata: Record<string, unknown> = {
      full_name: fullName,
      is_landlord: isLandlord,
      is_tenant: isTenant,
      is_connector: false,
      user_type: isLandlord ? "landlord" : "tenant",
      phone,
    };

    if (isLandlord) {
      metadata.province = province;
      metadata.city = city;
    }
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=%2Flogin%3Fconfirmed%3Dtrue`,
      },
    });

    if (!signUpError && data?.user?.identities?.length === 0) {
      setError("EMAIL_EXISTS");
      setLoading(false);
      return;
    }

    if (signUpError) {
      const msg = signUpError.message?.toLowerCase() ?? "";
      const isExisting =
        msg.includes("already registered") ||
        msg.includes("already taken") ||
        msg.includes("already exists") ||
        msg.includes("user already") ||
        signUpError.status === 400 ||
        signUpError.status === 422;

      if (isExisting) {
        setError("EMAIL_EXISTS");
        setLoading(false);
        return;
      }

      setError(parseSignUpError(signUpError.message));
      setLoading(false);
      return;
    }

    setLoading(false);
    setSignupEmail(email);
    setSignupDone(true);
  }

  // ── Signup complete: check your inbox ───────────────────────────────────────
  if (signupDone) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <svg
              className="h-8 w-8 text-blue-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-slate-900">
            Check your inbox
          </h2>
          <p className="text-sm text-slate-500">
            We sent a confirmation link to{" "}
            <strong className="text-slate-900">{signupEmail}</strong>.
            <br />
            Click the link in the email to activate your account.
          </p>
          <p className="mt-6 text-sm text-slate-400">
            Didn&apos;t receive it? Check your spam folder, or{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-700 hover:underline"
            >
              try signing in
            </Link>{" "}
            to resend.
          </p>
        </div>
      </div>
    );
  }

  // ── Step 0: Role selection ─────────────────────────────────────────────────
  if (!roleChosen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-3xl">
          <Logo />
          <p className="mb-2 text-center text-base font-semibold text-slate-700">
            Choose your starting journey
          </p>
          <p className="mb-6 text-center text-sm text-slate-400">
            You can add another role later from your account settings.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setIsLandlord(true);
                setIsTenant(false);
              }}
              aria-pressed={isLandlord}
              className={`group flex min-h-[220px] flex-col items-center gap-4 rounded-2xl border-2 p-8 text-center ${
                isLandlord
                  ? "border-blue-700 bg-blue-700 text-white shadow-lg"
                  : "border-slate-200 bg-white hover:border-blue-400 hover:shadow-md"
              }`}
            >
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl transition ${
                  isLandlord
                    ? "bg-blue-600"
                    : "bg-slate-100 text-slate-700 group-hover:bg-blue-100"
                }`}
              >
                <svg
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div>
                <p
                  className={`text-lg font-bold ${isLandlord ? "text-white" : "text-slate-900"}`}
                >
                  I’m a landlord
                </p>
                <p
                  className={`mt-1 text-sm ${isLandlord ? "text-blue-200" : "text-slate-500"}`}
                >
                  Manage properties, tenants, leases and rent
                </p>
              </div>
              {isLandlord && (
                <span className="mt-auto text-sm font-bold text-blue-200">
                  Selected
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsTenant(true);
                setIsLandlord(false);
              }}
              aria-pressed={isTenant}
              className={`group flex min-h-[220px] flex-col items-center gap-4 rounded-2xl border-2 p-8 text-center ${
                isTenant
                  ? "border-blue-700 bg-blue-700 text-white shadow-lg"
                  : "border-slate-200 bg-white hover:border-blue-400 hover:shadow-md"
              }`}
            >
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl transition ${
                  isTenant
                    ? "bg-blue-600"
                    : "bg-slate-100 text-slate-700 group-hover:bg-blue-100"
                }`}
              >
                <svg
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <div>
                <p
                  className={`text-lg font-bold ${isTenant ? "text-white" : "text-slate-900"}`}
                >
                  I’m a tenant
                </p>
                <p
                  className={`mt-1 text-sm ${isTenant ? "text-blue-200" : "text-slate-500"}`}
                >
                  Find a place and manage your rental profile
                </p>
              </div>
              {isTenant && (
                <span className="mt-auto text-sm font-bold text-blue-200">
                  Selected
                </span>
              )}
            </button>
          </div>

          {(isLandlord || isTenant) && (
            <button
              onClick={() => setRoleChosen(true)}
              className="mt-6 min-h-[48px] w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
            >
              Continue
            </button>
          )}

          {!isLandlord && !isTenant && (
            <p className="mt-6 text-center text-sm text-slate-400">
              Select at least one role to continue
            </p>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-slate-900 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // ── Personal info ──────────────────────────────────────────────────────────
  if (currentFlowStep === "personal") {
    const canContinue =
      fullName.trim() && email.trim() && password.length >= 8 && phone.trim();
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-md">
          <Logo />
          <StepDots steps={totalDots} current={0} />
          <div className="card p-6">
            <h2 className="mb-1 text-lg font-bold text-slate-900">
              Your details
            </h2>
            <p className="mb-5 text-sm text-slate-500">
              Personal information for your account
            </p>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Full name
                </label>
                <input
                  className="input-field"
                  placeholder="e.g. Ruan van der Merwe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email address
                </label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Password{" "}
                  <span className="text-slate-400">(min 8 characters)</span>
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Phone number
                </label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="e.g. 082 555 1234"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            {error === "EMAIL_EXISTS" ? (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 10,
                  padding: "16px 20px",
                  marginTop: 16,
                  marginBottom: 0,
                }}
              >
                <p
                  style={{
                    fontSize: 14,
                    color: "#991b1b",
                    fontWeight: 600,
                    marginBottom: 12,
                  }}
                >
                  An account with this email address already exists.
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <a
                    href="/login"
                    style={{
                      display: "inline-block",
                      padding: "8px 18px",
                      background: "#1e40af",
                      color: "white",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    Sign in instead
                  </a>
                  <a
                    href="/forgot-password"
                    style={{
                      display: "inline-block",
                      padding: "8px 18px",
                      border: "1.5px solid #e2e8f0",
                      color: "#374151",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      textDecoration: "none",
                      background: "white",
                    }}
                  >
                    Forgot your password?
                  </a>
                </div>
              </div>
            ) : error ? (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#dc2626",
                  marginTop: 16,
                  marginBottom: 0,
                }}
              >
                {error}
              </div>
            ) : null}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={back}
                className="min-h-[44px] flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!canContinue || loading}
                onClick={advance}
                className="min-h-[44px] flex-[2] rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {flowStepIdx === flowSteps.length - 1
                  ? loading
                    ? "Creating account…"
                    : "Create my account"
                  : "Continue →"}
              </button>
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-slate-900 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // ── Landlord details ───────────────────────────────────────────────────────
  if (currentFlowStep === "landlord-details") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-md">
          <Logo />
          <StepDots steps={totalDots} current={flowStepIdx} />
          <div className="card p-6">
            <h2 className="mb-1 text-lg font-bold text-slate-900">
              Landlord details
            </h2>
            <p className="mb-5 text-sm text-slate-500">
              Tell us about your properties
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Province
                  </label>
                  <select
                    className="input-field"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                  >
                    <option value="">Select…</option>
                    {PROVINCES.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    City
                  </label>
                  <input
                    className="input-field"
                    placeholder="e.g. Cape Town"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  How many properties do you manage?
                </label>
                <div className="flex gap-2">
                  {PROPERTY_COUNTS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPropertyCount(c)}
                      className={`min-h-[44px] flex-1 rounded-lg border px-2 py-2 text-sm font-medium transition ${
                        propertyCount === c
                          ? "border-blue-700 bg-blue-700 text-white"
                          : "border-slate-200 text-slate-600 hover:border-slate-400"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {error === "EMAIL_EXISTS" ? (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 10,
                  padding: "16px 20px",
                  marginTop: 16,
                  marginBottom: 0,
                }}
              >
                <p
                  style={{
                    fontSize: 14,
                    color: "#991b1b",
                    fontWeight: 600,
                    marginBottom: 12,
                  }}
                >
                  An account with this email address already exists.
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <a
                    href="/login"
                    style={{
                      display: "inline-block",
                      padding: "8px 18px",
                      background: "#1e40af",
                      color: "white",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    Sign in instead
                  </a>
                  <a
                    href="/forgot-password"
                    style={{
                      display: "inline-block",
                      padding: "8px 18px",
                      border: "1.5px solid #e2e8f0",
                      color: "#374151",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      textDecoration: "none",
                      background: "white",
                    }}
                  >
                    Forgot your password?
                  </a>
                </div>
              </div>
            ) : error ? (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#dc2626",
                  marginTop: 16,
                  marginBottom: 0,
                }}
              >
                {error}
              </div>
            ) : null}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={back}
                className="min-h-[44px] flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={advance}
                className="min-h-[44px] flex-[2] rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
              >
                {flowStepIdx === flowSteps.length - 1
                  ? loading
                    ? "Creating account…"
                    : "Create account"
                  : "Continue →"}
              </button>
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-slate-900 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return null;
}
