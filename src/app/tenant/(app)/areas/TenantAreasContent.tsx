"use client";

import { useState } from "react";
import {
  score_buyer_property,
  type BuyerProfile,
  type BuyerScoringResult,
} from "@/lib/scoring/engine";

// ─── Suburb data (mirrors /areas page) ───────────────────────────────────────

interface SuburbData {
  name: string;
  city: string;
  avg_rent: number;
  buy_price: number;
  annual_growth: number;
  vacancy: number;
  crime_index: number;
  description: string;
}

const SUBURBS: SuburbData[] = [
  { name: "Sea Point", city: "Cape Town", avg_rent: 18000, buy_price: 3200000, annual_growth: 0.07, vacancy: 0.06, crime_index: 45, description: "Vibrant beachfront suburb with high demand and premium rentals." },
  { name: "Rondebosch", city: "Cape Town", avg_rent: 14000, buy_price: 2600000, annual_growth: 0.06, vacancy: 0.05, crime_index: 30, description: "Established leafy suburb near UCT with consistent tenant demand." },
  { name: "Claremont", city: "Cape Town", avg_rent: 15000, buy_price: 2800000, annual_growth: 0.065, vacancy: 0.055, crime_index: 35, description: "Commercial and residential mix with strong retail amenities." },
  { name: "Sandton", city: "Johannesburg", avg_rent: 22000, buy_price: 4500000, annual_growth: 0.05, vacancy: 0.1, crime_index: 55, description: "Financial hub with premium corporate tenants and high yields." },
  { name: "Fourways", city: "Johannesburg", avg_rent: 14000, buy_price: 2200000, annual_growth: 0.055, vacancy: 0.09, crime_index: 50, description: "Family-friendly northern suburbs with growing infrastructure." },
  { name: "Menlyn", city: "Pretoria", avg_rent: 12000, buy_price: 1800000, annual_growth: 0.058, vacancy: 0.07, crime_index: 40, description: "Eastern Pretoria retail and residential hub with steady growth." },
  { name: "Umhlanga", city: "Durban", avg_rent: 16000, buy_price: 3000000, annual_growth: 0.07, vacancy: 0.06, crime_index: 35, description: "Coastal premium suburb with high demand from professionals." },
  { name: "Stellenbosch", city: "Cape Winelands", avg_rent: 11000, buy_price: 2100000, annual_growth: 0.075, vacancy: 0.05, crime_index: 28, description: "University town with strong student and young professional demand." },
  { name: "Greenpoint", city: "Cape Town", avg_rent: 17000, buy_price: 3100000, annual_growth: 0.072, vacancy: 0.065, crime_index: 42, description: "Urban lifestyle suburb between the CBD and Sea Point." },
  { name: "Braamfontein", city: "Johannesburg", avg_rent: 9000, buy_price: 1100000, annual_growth: 0.04, vacancy: 0.12, crime_index: 65, description: "Student and creative hub undergoing urban renewal." },
  { name: "Paarl", city: "Cape Winelands", avg_rent: 9500, buy_price: 1600000, annual_growth: 0.065, vacancy: 0.06, crime_index: 38, description: "Affordable Winelands town with growing remote-worker appeal." },
  { name: "La Lucia", city: "Durban", avg_rent: 13000, buy_price: 2400000, annual_growth: 0.06, vacancy: 0.07, crime_index: 30, description: "Quiet northern Durban suburb popular with families." },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtRand(n: number) {
  return `R${n.toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
}

function scoreColor(score: number) {
  if (score >= 70) return "text-green-700 bg-green-100";
  if (score >= 50) return "text-amber-700 bg-amber-100";
  return "text-red-700 bg-red-100";
}

function barColor(score: number) {
  if (score >= 0.7) return "bg-green-500";
  if (score >= 0.4) return "bg-amber-500";
  return "bg-red-500";
}

function riskBadge(riskScore: number) {
  if (riskScore >= 0.65) return { label: "Low risk", cls: "bg-green-100 text-green-700" };
  if (riskScore >= 0.45) return { label: "Medium risk", cls: "bg-amber-100 text-amber-700" };
  return { label: "High risk", cls: "bg-red-100 text-red-700" };
}

function buildPropertyData(suburb: SuburbData) {
  return {
    property_id: suburb.name,
    suburb: suburb.name,
    purchase_price: suburb.buy_price,
    monthly_rent: suburb.avg_rent,
    annual_price_growth: suburb.annual_growth,
    vacancy_rate: suburb.vacancy,
    crime_index: suburb.crime_index,
    discount_to_market: 0,
    risk_index: suburb.crime_index,
  };
}

const STRATEGIES: { value: BuyerProfile["strategy"]; label: string }[] = [
  { value: "yield", label: "Yield-focused" },
  { value: "growth", label: "Growth-focused" },
  { value: "stability", label: "Stability" },
  { value: "balanced", label: "Balanced" },
];

const CITIES = ["All", "Cape Town", "Johannesburg", "Pretoria", "Durban", "Cape Winelands"];

// ─── SuburbCard ───────────────────────────────────────────────────────────────

function SuburbCard({ suburb, result }: { suburb: SuburbData; result: BuyerScoringResult }) {
  const [expanded, setExpanded] = useState(false);
  const badge = scoreColor(result.score);
  const risk = riskBadge(result.insights.risk?.score ?? 0.5);
  const ins = result.insights;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900">{suburb.name}</h3>
            <p className="text-xs text-slate-400">{suburb.city}</p>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-sm font-extrabold tabular-nums ${badge}`}>
            {result.score}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-400">Avg rent</p>
            <p className="text-sm font-semibold text-slate-900">{fmtRand(suburb.avg_rent)}/mo</p>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-400">Buy price</p>
            <p className="text-sm font-semibold text-slate-900">{fmtRand(suburb.buy_price)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-400">Annual growth</p>
            <p className="text-sm font-semibold text-slate-900">{(suburb.annual_growth * 100).toFixed(1)}%</p>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-400">Vacancy</p>
            <p className="text-sm font-semibold text-slate-900">{(suburb.vacancy * 100).toFixed(1)}%</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {[
            { label: "Yield", score: ins.yield?.score ?? 0.5 },
            { label: "Growth", score: ins.capital_growth?.score ?? 0.5 },
            { label: "Stability", score: ins.stability?.score ?? 0.5 },
          ].map(({ label, score }) => (
            <div key={label}>
              <div className="mb-0.5 flex justify-between text-xs">
                <span className="text-slate-500">{label}</span>
                <span className="text-slate-400">{Math.round(score * 100)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${barColor(score)}`} style={{ width: `${Math.round(score * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${risk.cls}`}>{risk.label}</span>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            {expanded ? "Hide breakdown ↑" : "Score breakdown ↓"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 text-xs text-slate-600">
          <p className="mb-2 font-semibold text-slate-700">{suburb.description}</p>
          {[
            { label: "Yield", insight: ins.yield },
            { label: "Capital growth", insight: ins.capital_growth },
            { label: "Stability", insight: ins.stability },
            { label: "Value", insight: ins.value },
            { label: "Liquidity", insight: ins.liquidity },
            { label: "Risk", insight: ins.risk },
          ].map(({ label, insight }) =>
            insight ? (
              <div key={label} className="mb-1.5">
                <span className="font-medium text-slate-700">{label}: </span>
                {insight.message}
              </div>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────

export function TenantAreasContent() {
  const [strategy, setStrategy] = useState<BuyerProfile["strategy"]>("balanced");
  const [city, setCity] = useState("All");

  const buyerProfile: BuyerProfile = {
    budget: 5000000,
    strategy,
    risk_tolerance: "medium",
    preferred_suburbs: [],
    must_haves: [],
    dealbreakers: [],
  };

  const filtered = SUBURBS.filter((s) => city === "All" || s.city === city);
  const scored = filtered
    .map((s) => ({ suburb: s, result: score_buyer_property(buyerProfile, buildPropertyData(s)) }))
    .sort((a, b) => b.result.score - a.result.score);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Find by Area</h1>
        <p className="mt-1 text-sm text-slate-500">
          Compare suburbs by yield, growth, stability and risk — so you can research where to invest or rent.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Scores are indicative estimates based on market data. Not financial advice.
        </p>
      </div>

      {/* Controls */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Strategy</p>
          <div className="flex flex-wrap gap-2">
            {STRATEGIES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStrategy(value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  strategy === value
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">City</p>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {scored.map(({ suburb, result }) => (
          <SuburbCard key={suburb.name} suburb={suburb} result={result} />
        ))}
      </div>
    </div>
  );
}
