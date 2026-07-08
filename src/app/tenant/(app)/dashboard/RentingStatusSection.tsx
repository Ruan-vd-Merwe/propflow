"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { LogMaintenanceButton } from "./LogMaintenanceButton";

type Journey = "current" | "looking" | "replacing";

const TABS: { id: Journey; label: string }[] = [
  { id: "current", label: "Current rental" },
  { id: "looking", label: "Finding a place" },
  { id: "replacing", label: "Replacing a flatmate" },
];

type Action = { label: string; href: string };

export function RentingStatusSection({
  hasActiveLease,
  tenantEmail,
  tenantName,
}: {
  hasActiveLease: boolean;
  tenantEmail?: string;
  tenantName?: string;
}) {
  const [journey, setJourney] = useState<Journey>(
    hasActiveLease ? "current" : "looking",
  );

  return (
    <section className="mb-6">
      <div className="inline-flex flex-wrap gap-1 rounded-full bg-slate-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setJourney(tab.id)}
            className={`min-h-[44px] rounded-full px-4 py-2 text-sm font-semibold transition ${
              journey === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {journey === "current" && (
          <JourneyCard
            title="Current rental"
            body="Keep your current rental organised and build trust for your next move."
            primary={{ label: "Manage current home", href: "#current-home" }}
            secondary={[
              { label: "Update rental preferences", href: "/tenant/preferences" },
              { label: "Browse properties", href: "/tenant/browse" },
            ]}
            extra={
              <LogMaintenanceButton
                hasActiveLease={hasActiveLease}
                tenantEmail={tenantEmail}
                tenantName={tenantName}
              />
            }
          />
        )}

        {journey === "looking" && (
          <JourneyCard
            title="Finding a place"
            body="Set your budget, areas, and move in date so we can recommend better properties."
            primary={{ label: "Browse matching properties", href: "/tenant/browse" }}
            secondary={[
              { label: "Update rental preferences", href: "/tenant/preferences" },
              { label: "Review applications", href: "#applications" },
            ]}
          />
        )}

        {journey === "replacing" && hasActiveLease && (
          <JourneyCard
            title="Find someone to join your place"
            body="Create a flatmate opportunity for your current place. Share it with people you trust, then review applicants through PropTrust."
            primary={{ label: "Set up flatmate opportunity", href: "#flatmate" }}
          />
        )}

        {journey === "replacing" && !hasActiveLease && (
          <JourneyCard
            title="Find someone to join your place"
            body="This is for tenants with a current lease. Add your lease details first to set this up."
            primary={{ label: "Add your lease details", href: "/tenant/applications#lease-upload" }}
            badge="Needs a lease"
          />
        )}
      </div>
    </section>
  );
}

function JourneyCard({
  title,
  body,
  primary,
  secondary,
  extra,
  badge,
}: {
  title: string;
  body: string;
  primary: Action;
  secondary?: Action[];
  extra?: ReactNode;
  badge?: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-slate-900">{title}</p>
        {badge && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-500">
        {body}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          href={primary.href}
          className="rounded-lg bg-[#1e40af] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          {primary.label}
        </Link>
        {secondary?.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            {action.label}
          </Link>
        ))}
        {extra}
      </div>
    </div>
  );
}
