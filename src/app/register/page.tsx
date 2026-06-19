"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
const PROPERTY_COUNTS = ["1–5", "6–20", "20+"];
const LEASE_LENGTHS = [6, 12, 24];
const EMPLOYMENT_OPTIONS = [
  { value: "employed", label: "Employed" },
  { value: "self_employed", label: "Self-employed" },
  { value: "student", label: "Student" },
  { value: "other", label: "Other" },
];

type FlowStep =
  | "personal"
  | "landlord-details"
  | "tenant-prefs"
  | "tenant-financial";

function Logo() {
  return (
    <div className="mb-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-700">
        <svg
          className="h-6 w-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      </div>
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
  const router = useRouter();

  // ── Role selection ─────────────────────────────────────────────────────────
  const [isLandlord, setIsLandlord] = useState(false);
  const [isTenant, setIsTenant] = useState(false);
  const [roleChosen, setRoleChosen] = useState(false);

  // ── Flow step ──────────────────────────────────────────────────────────────
  const [flowStepIdx, setFlowStepIdx] = useState(0);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Shared fields ──────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // ── Landlord fields ────────────────────────────────────────────────────────
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [propertyCount, setPropertyCount] = useState("");

  // ── Tenant step 1 ──────────────────────────────────────────────────────────
  const [saId, setSaId] = useState("");

  // ── Tenant step 2 ──────────────────────────────────────────────────────────
  const [currentArea, setCurrentArea] = useState("");
  const [currentProvince, setCurrentProvince] = useState("");
  const [lookingArea, setLookingArea] = useState("");
  const [lookingProvince, setLookingProvince] = useState("");
  const [budgetMin, setBudgetMin] = useState(3000);
  const [budgetMax, setBudgetMax] = useState(15000);
  const [moveInDate, setMoveInDate] = useState("");
  const [leaseLength, setLeaseLength] = useState<number>(12);

  // ── Tenant step 3 ──────────────────────────────────────────────────────────
  const [employmentStatus, setEmploymentStatus] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function getFlowSteps(): FlowStep[] {
    const steps: FlowStep[] = ["personal"];
    if (isLandlord) steps.push("landlord-details");
    if (isTenant) {
      steps.push("tenant-prefs");
      steps.push("tenant-financial");
    }
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
    if (m.includes("user already registered") || m.includes("already been registered") || m.includes("already registered")) {
      return "An account with this email already exists. Try signing in or reset your password instead.";
    }
    if (m.includes("invalid email") || m.includes("email address is invalid") || m.includes("unable to validate email")) {
      return "Please enter a valid email address.";
    }
    if (m.includes("password should be") || m.includes("password must be") || m.includes("too short")) {
      return "Your password must be at least 8 characters.";
    }
    if (m.includes("sending email") || m.includes("smtp") || m.includes("email sending") || m.includes("error sending") || m.includes("failed to send")) {
      return "We couldn't send your confirmation email right now. Please try again in a few minutes, or contact support@proptrust.co.za.";
    }
    if (m.includes("invalid redirect") || m.includes("redirect_to") || m.includes("unauthorized")) {
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
      user_type: isLandlord ? "landlord" : "tenant", // backwards compat
      phone,
    };

    if (isLandlord) {
      metadata.province = province;
      metadata.city = city;
    }
    if (isTenant) {
      metadata.sa_id_number = saId || null;
      metadata.current_area = currentArea || null;
      metadata.current_province = currentProvince || null;
      metadata.looking_in_area = lookingArea || null;
      metadata.looking_in_province = lookingProvince || null;
      metadata.budget_min = budgetMin * 100;
      metadata.budget_max = budgetMax * 100;
      metadata.move_in_date = moveInDate || null;
      metadata.lease_length_months = leaseLength;
      metadata.employment_status = employmentStatus || null;
      metadata.monthly_income = monthlyIncome
        ? parseInt(monthlyIncome) * 100
        : null;
      metadata.whatsapp_opted_in = whatsappOptIn;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
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

    // Send OTP confirmation code via our own endpoint
    try {
      const res = await fetch("/api/auth/send-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, userId: data?.user?.id ?? null }),
      });
      if (!res.ok) {
        console.error("[register] send-confirmation failed:", await res.text());
      }
    } catch (err) {
      console.error("[register] send-confirmation threw:", err);
    }

    setLoading(false);
    router.push(`/confirm-email?email=${encodeURIComponent(email)}`);
  }

  // ── Step 0: Role selection ─────────────────────────────────────────────────
  if (!roleChosen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-lg">
          <Logo />
          <div className="mb-4 text-right text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-slate-900 hover:underline"
            >
              Sign in
            </Link>
          </div>
          <p className="mb-2 text-center text-base font-semibold text-slate-700">
            What are you signing up as?
          </p>
          <p className="mb-6 text-center text-sm text-slate-400">
            You can select both — one account, two roles.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={() => setIsLandlord((v) => !v)}
              className={`group flex flex-col items-center gap-4 rounded-2xl border-2 p-8 text-center transition ${
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
                  I own or manage property
                </p>
                <p
                  className={`mt-1 text-sm ${isLandlord ? "text-blue-200" : "text-slate-500"}`}
                >
                  Landlord portal — manage properties &amp; tenants
                </p>
              </div>
              {isLandlord && (
                <span className="mt-auto text-sm font-bold text-blue-200">
                  ✓ Selected
                </span>
              )}
            </button>

            <button
              onClick={() => setIsTenant((v) => !v)}
              className={`group flex flex-col items-center gap-4 rounded-2xl border-2 p-8 text-center transition ${
                isTenant
                  ? "border-green-600 bg-green-600 text-white shadow-lg"
                  : "border-slate-200 bg-white hover:border-green-400 hover:shadow-md"
              }`}
            >
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl transition ${
                  isTenant
                    ? "bg-green-500"
                    : "bg-slate-100 text-slate-700 group-hover:bg-green-100"
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
                  I am looking to rent
                </p>
                <p
                  className={`mt-1 text-sm ${isTenant ? "text-green-200" : "text-slate-500"}`}
                >
                  Tenant profile — find your next home
                </p>
              </div>
              {isTenant && (
                <span className="mt-auto text-sm font-bold text-green-200">
                  ✓ Selected
                </span>
              )}
            </button>
          </div>

          {(isLandlord || isTenant) && (
            <button
              onClick={() => setRoleChosen(true)}
              className="mt-6 w-full rounded-xl bg-blue-700 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
            >
              {isLandlord && isTenant
                ? "Continue with both roles →"
                : "Continue →"}
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
              {isTenant && !isLandlord && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    SA ID number{" "}
                    <span className="text-slate-400">(13 digits)</span>
                  </label>
                  <input
                    className="input-field font-mono"
                    placeholder="0000000000000"
                    maxLength={13}
                    value={saId}
                    onChange={(e) => setSaId(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              )}
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
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!canContinue}
                onClick={advance}
                className="flex-[2] rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue →
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
                      className={`flex-1 rounded-lg border py-2 text-sm font-medium transition ${
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
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={advance}
                className="flex-[2] rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
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

  // ── Tenant preferences ─────────────────────────────────────────────────────
  if (currentFlowStep === "tenant-prefs") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-md">
          <Logo />
          <StepDots steps={totalDots} current={flowStepIdx} />
          <div className="card p-6">
            <h2 className="mb-1 text-lg font-bold text-slate-900">
              Rental preferences
            </h2>
            <p className="mb-5 text-sm text-slate-500">
              Tell us what you are looking for
            </p>
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">
                  Where do you currently live?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="input-field"
                    placeholder="Area / suburb"
                    value={currentArea}
                    onChange={(e) => setCurrentArea(e.target.value)}
                  />
                  <select
                    className="input-field"
                    value={currentProvince}
                    onChange={(e) => setCurrentProvince(e.target.value)}
                  >
                    <option value="">Province…</option>
                    {PROVINCES.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">
                  Where are you looking to rent?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="input-field"
                    placeholder="Area / suburb"
                    value={lookingArea}
                    onChange={(e) => setLookingArea(e.target.value)}
                  />
                  <select
                    className="input-field"
                    value={lookingProvince}
                    onChange={(e) => setLookingProvince(e.target.value)}
                  >
                    <option value="">Province…</option>
                    {PROVINCES.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
                  Monthly budget
                  <span className="font-normal text-slate-500">
                    R{budgetMin.toLocaleString()} – R
                    {budgetMax.toLocaleString()}
                  </span>
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-xs text-slate-400">Min</span>
                    <input
                      type="range"
                      min={3000}
                      max={50000}
                      step={500}
                      value={budgetMin}
                      onChange={(e) =>
                        setBudgetMin(
                          Math.min(parseInt(e.target.value), budgetMax - 500),
                        )
                      }
                      className="flex-1 accent-blue-700"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-xs text-slate-400">Max</span>
                    <input
                      type="range"
                      min={3000}
                      max={50000}
                      step={500}
                      value={budgetMax}
                      onChange={(e) =>
                        setBudgetMax(
                          Math.max(parseInt(e.target.value), budgetMin + 500),
                        )
                      }
                      className="flex-1 accent-blue-700"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  When do you need to move in?
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={moveInDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setMoveInDate(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Ideal lease length
                </label>
                <div className="flex gap-2">
                  {LEASE_LENGTHS.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLeaseLength(l)}
                      className={`flex-1 rounded-lg border py-2 text-sm font-medium transition ${
                        leaseLength === l
                          ? "border-blue-700 bg-blue-700 text-white"
                          : "border-slate-200 text-slate-600 hover:border-slate-400"
                      }`}
                    >
                      {l} months
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
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={advance}
                className="flex-[2] rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                Continue →
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

  // ── Tenant financial ───────────────────────────────────────────────────────
  if (currentFlowStep === "tenant-financial") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-md">
          <Logo />
          <StepDots steps={totalDots} current={flowStepIdx} />
          <div className="card p-6">
            <h2 className="mb-1 text-lg font-bold text-slate-900">
              Financial details
            </h2>
            <p className="mb-5 text-sm text-slate-500">
              Helps landlords assess affordability. Kept private.
            </p>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Employment status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {EMPLOYMENT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setEmploymentStatus(opt.value)}
                      className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                        employmentStatus === opt.value
                          ? "border-blue-700 bg-blue-700 text-white"
                          : "border-slate-200 text-slate-600 hover:border-slate-400"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Monthly net income
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                    R
                  </span>
                  <input
                    type="number"
                    className="input-field pl-7"
                    placeholder="e.g. 25000"
                    min={0}
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Your income after tax. Never shared without permission.
                </p>
              </div>
              {monthlyIncome && parseInt(monthlyIncome) > 0 && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Affordability preview
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    Can comfortably afford up to{" "}
                    <strong className="text-slate-900">
                      R
                      {Math.round(parseInt(monthlyIncome) / 3).toLocaleString()}
                    </strong>{" "}
                    /mo <span className="text-slate-400">(30% rule)</span>
                  </p>
                </div>
              )}
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                <input
                  type="checkbox"
                  checked={whatsappOptIn}
                  onChange={(e) => setWhatsappOptIn(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-green-600"
                />
                <div>
                  <p className="text-sm font-semibold text-green-800">
                    💬 Receive WhatsApp notifications
                  </p>
                  <p className="mt-0.5 text-xs text-green-700">
                    Rent reminders, maintenance &amp; introductions. Opt out
                    anytime.
                  </p>
                </div>
              </label>
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
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                disabled={loading || !employmentStatus}
                onClick={advance}
                className="flex-[2] rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Creating account…" : "Create account"}
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
