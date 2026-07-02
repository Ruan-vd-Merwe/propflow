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
const PROPERTY_COUNTS = ["1–5", "6–20", "20+"];

const CONNECTOR_TASK_OPTIONS = [
  "Property viewings",
  "Move-in help",
  "Tenant check-ins",
  "Property check-ups",
  "Local errands",
  "Dog walking",
  "Elderly support",
  "Other local help",
];

const AVAILABILITY_OPTIONS = ["Weekdays", "Evenings", "Weekends", "Flexible"];

type FlowStep =
  | "personal"
  | "landlord-details"
  | "connector-area"
  | "connector-about";

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
  const [isConnector, setIsConnector] = useState(false);
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

  // ── Connector fields ──────────────────────────────────────────────────────
  const [connectorArea, setConnectorArea] = useState("");
  const [connectorProvince, setConnectorProvince] = useState("");
  const [connectorTasks, setConnectorTasks] = useState<string[]>([]);
  const [connectorAvailability, setConnectorAvailability] = useState<string[]>(
    [],
  );
  const [connectorBio, setConnectorBio] = useState("");
  const [connectorReference, setConnectorReference] = useState("");

  // ── Pre-select role from URL ──────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const role = params.get("role");
    if (role === "connector") setIsConnector(true);
    if (role === "owner") setIsLandlord(true);
    if (role === "tenant") setIsTenant(true);
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function getFlowSteps(): FlowStep[] {
    const steps: FlowStep[] = ["personal"];
    if (isLandlord) steps.push("landlord-details");
    if (isConnector) {
      steps.push("connector-area");
      steps.push("connector-about");
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
      is_connector: isConnector,
      user_type: isLandlord ? "landlord" : isTenant ? "tenant" : "connector",
      phone,
    };

    if (isLandlord) {
      metadata.province = province;
      metadata.city = city;
    }
    if (isConnector) {
      metadata.connector_area = connectorArea || null;
      metadata.connector_province = connectorProvince || null;
      metadata.connector_tasks = connectorTasks;
      metadata.connector_availability = connectorAvailability;
      metadata.connector_bio = connectorBio || null;
      metadata.connector_reference = connectorReference || null;
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
            <svg className="h-8 w-8 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-slate-900">Check your inbox</h2>
          <p className="text-sm text-slate-500">
            We sent a confirmation link to{" "}
            <strong className="text-slate-900">{signupEmail}</strong>.
            <br />
            Click the link in the email to activate your account.
          </p>
          <p className="mt-6 text-sm text-slate-400">
            Didn&apos;t receive it? Check your spam folder, or{" "}
            <Link href="/login" className="font-semibold text-blue-700 hover:underline">
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
            What are you signing up as?
          </p>
          <p className="mb-6 text-center text-sm text-slate-400">
            You can select more than one — one account, multiple roles.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
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

            <button
              onClick={() => setIsConnector((v) => !v)}
              className={`group flex flex-col items-center gap-4 rounded-2xl border-2 p-8 text-center transition ${
                isConnector
                  ? "border-amber-600 bg-amber-600 text-white shadow-lg"
                  : "border-slate-200 bg-white hover:border-amber-400 hover:shadow-md"
              }`}
            >
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl transition ${
                  isConnector
                    ? "bg-amber-500"
                    : "bg-slate-100 text-slate-700 group-hover:bg-amber-100"
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
                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                  />
                </svg>
              </div>
              <div>
                <p
                  className={`text-lg font-bold ${isConnector ? "text-white" : "text-slate-900"}`}
                >
                  I want to help locally
                </p>
                <p
                  className={`mt-1 text-sm ${isConnector ? "text-amber-200" : "text-slate-500"}`}
                >
                  Earn by helping with viewings, check-ins, errands and local
                  support
                </p>
              </div>
              {isConnector && (
                <span className="mt-auto text-sm font-bold text-amber-200">
                  ✓ Selected
                </span>
              )}
            </button>
          </div>

          {(isLandlord || isTenant || isConnector) && (
            <button
              onClick={() => setRoleChosen(true)}
              className="mt-6 w-full rounded-xl bg-blue-700 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
            >
              {[isLandlord, isTenant, isConnector].filter(Boolean).length > 1
                ? `Continue with ${[isLandlord, isTenant, isConnector].filter(Boolean).length} roles →`
                : "Continue →"}
            </button>
          )}

          {!isLandlord && !isTenant && !isConnector && (
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
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!canContinue || loading}
                onClick={advance}
                className="flex-[2] rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
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

  // ── Connector: area and tasks ─────────────────────────────────────────────
  if (currentFlowStep === "connector-area") {
    const toggleTask = (task: string) => {
      setConnectorTasks((prev) =>
        prev.includes(task) ? prev.filter((t) => t !== task) : [...prev, task],
      );
    };
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-md">
          <Logo />
          <StepDots steps={totalDots} current={flowStepIdx} />
          <div className="card p-6">
            <h2 className="mb-1 text-lg font-bold text-slate-900">
              Where and how can you help?
            </h2>
            <p className="mb-5 text-sm text-slate-500">
              Pick your area and the kinds of tasks you are interested in
            </p>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Province
                  </label>
                  <select
                    className="input-field"
                    value={connectorProvince}
                    onChange={(e) => setConnectorProvince(e.target.value)}
                  >
                    <option value="">Select…</option>
                    {PROVINCES.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Area / suburb
                  </label>
                  <input
                    className="input-field"
                    placeholder="e.g. Sea Point"
                    value={connectorArea}
                    onChange={(e) => setConnectorArea(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">
                  What can you help with?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {CONNECTOR_TASK_OPTIONS.map((task) => (
                    <button
                      key={task}
                      type="button"
                      onClick={() => toggleTask(task)}
                      className={`rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition ${
                        connectorTasks.includes(task)
                          ? "border-amber-600 bg-amber-600 text-white"
                          : "border-slate-200 text-slate-600 hover:border-slate-400"
                      }`}
                    >
                      {task}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {error && error !== "EMAIL_EXISTS" && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">
                {error}
              </div>
            )}
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

  // ── Connector: about you ──────────────────────────────────────────────────
  if (currentFlowStep === "connector-about") {
    const toggleAvailability = (opt: string) => {
      setConnectorAvailability((prev) =>
        prev.includes(opt) ? prev.filter((a) => a !== opt) : [...prev, opt],
      );
    };
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-md">
          <Logo />
          <StepDots steps={totalDots} current={flowStepIdx} />
          <div className="card p-6">
            <h2 className="mb-1 text-lg font-bold text-slate-900">
              About you
            </h2>
            <p className="mb-5 text-sm text-slate-500">
              A few details so people know who you are
            </p>
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">
                  When are you usually available?
                </p>
                <div className="flex flex-wrap gap-2">
                  {AVAILABILITY_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleAvailability(opt)}
                      className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                        connectorAvailability.includes(opt)
                          ? "border-amber-600 bg-amber-600 text-white"
                          : "border-slate-200 text-slate-600 hover:border-slate-400"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Short bio
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="A few words about yourself and why you want to help locally"
                  value={connectorBio}
                  onChange={(e) => setConnectorBio(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Reference{" "}
                  <span className="text-slate-400">(optional)</span>
                </label>
                <input
                  className="input-field"
                  placeholder="Name and contact number"
                  value={connectorReference}
                  onChange={(e) => setConnectorReference(e.target.value)}
                />
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">
                  Connectors are verified before taking paid tasks.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  We will ask for ID verification after you sign up. This keeps
                  everyone safe.
                </p>
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
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">
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
