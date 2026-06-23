"use client";

import { useRouter } from "next/navigation";

interface VerificationFormProps {
  userId: string;
  currentStatus: string;
}

export function VerificationForm({ userId, currentStatus }: VerificationFormProps) {
  const router = useRouter();
  void userId;
  void currentStatus;

  return (
    <div className="space-y-6">
      <div className="card p-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100">
          <svg
            className="h-7 w-7 text-blue-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Become Property Protected
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Verify your profile to increase trust, improve rankings, and avoid
          repeatedly uploading documents for every application.
        </p>

        <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
          <div className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50 p-3">
            <span className="mt-0.5 text-green-600">&#10003;</span>
            <span className="text-sm text-slate-700">
              Higher ranking in landlord searches
            </span>
          </div>
          <div className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50 p-3">
            <span className="mt-0.5 text-green-600">&#10003;</span>
            <span className="text-sm text-slate-700">
              Faster application approvals
            </span>
          </div>
          <div className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50 p-3">
            <span className="mt-0.5 text-green-600">&#10003;</span>
            <span className="text-sm text-slate-700">
              Better property recommendations
            </span>
          </div>
          <div className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50 p-3">
            <span className="mt-0.5 text-green-600">&#10003;</span>
            <span className="text-sm text-slate-700">Reduced paperwork</span>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Verification is optional. You can complete it later from your profile.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push("/tenant/profile")}
            className="btn-primary flex-1"
          >
            Become Property Protected
          </button>
          <button
            type="button"
            onClick={() => router.push("/tenant/profile")}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
