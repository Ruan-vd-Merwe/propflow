"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { NavBar } from "@/components/NavBar";

// ─── Types ────────────────────────────────────────────────────────────────────

type Digest = {
  id: string;
  subject: string | null;
  status: "draft" | "approved" | "sent";
  sent_at: string | null;
  articles_count: number;
  html_content: string | null;
  week_start_date: string;
  week_end_date: string;
  created_at: string;
};

type Article = {
  id: string;
  title: string;
  category: string | null;
  relevance_score: number;
  url: string;
  published_at: string | null;
  section?: string;
};

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "sent"
      ? "bg-green-100 text-green-700"
      : status === "approved"
        ? "bg-blue-100 text-blue-700"
        : "bg-amber-100 text-amber-700";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${cls}`}
    >
      {status}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewsAdminPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [digest, setDigest] = useState<Digest | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [showTestInput, setShowTestInput] = useState(false);
  const [subCount, setSubCount] = useState<number | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 5000);
  }

  const loadDigest = useCallback(async () => {
    const res = await fetch("/api/admin/property-news/digests/latest");
    if (res.ok) {
      const data = await res.json();
      setDigest(data.digest);
      setArticles(data.articles ?? []);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("is_landlord, email")
        .eq("id", user.id)
        .single();
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      const ok =
        prof?.is_landlord || (adminEmail && prof?.email === adminEmail);
      if (!ok) {
        router.push("/dashboard");
        return;
      }

      await loadDigest();

      // Subscriber count
      const { count } = await supabase
        .from("newsletter_subscribers")
        .select("id", { count: "exact", head: true })
        .eq("is_subscribed", true);
      setSubCount(count ?? 0);

      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function action(key: string, fn: () => Promise<Response>) {
    setActionLoading(key);
    try {
      const res = await fn();
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "Error", false);
        return;
      }
      return data;
    } catch (err) {
      showToast(String(err), false);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleFetch() {
    const data = await action("fetch", () =>
      fetch("/api/admin/property-news/fetch", { method: "POST" }),
    );
    if (data) {
      showToast(
        `Fetched ${data.fetched} articles, stored ${data.stored} new, summarized ${data.summarized}.`,
      );
      await loadDigest();
    }
  }

  async function handleGenerate() {
    const data = await action("generate", () =>
      fetch("/api/admin/property-news/generate-digest", { method: "POST" }),
    );
    if (data) {
      showToast(`Digest created with ${data.articlesCount} articles.`);
      await loadDigest();
    }
  }

  async function handleTestSend() {
    if (!digest || !testEmail) return;
    const data = await action("test-send", () =>
      fetch("/api/admin/property-news/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ digestId: digest.id, email: testEmail }),
      }),
    );
    if (data) {
      showToast(`Test email sent to ${testEmail}.`);
      setShowTestInput(false);
    }
  }

  async function handleApprove() {
    if (!digest) return;
    const data = await action("approve", () =>
      fetch("/api/admin/property-news/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ digestId: digest.id }),
      }),
    );
    if (data) {
      showToast("Digest approved.");
      await loadDigest();
    }
  }

  async function handleSend() {
    if (!digest) return;
    const confirmed = window.confirm(
      `Send this digest to ${subCount ?? "?"} subscriber${subCount !== 1 ? "s" : ""}?`,
    );
    if (!confirmed) return;

    const data = await action("send", () =>
      fetch("/api/admin/property-news/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ digestId: digest.id }),
      }),
    );
    if (data) {
      showToast(
        `Sent to ${data.sent} subscribers. ${data.failed > 0 ? `${data.failed} failed.` : ""}`,
      );
      await loadDigest();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavBar />
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
        </div>
      </div>
    );
  }

  const busy = (key: string) => actionLoading === key;

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg ${toast.ok ? "bg-slate-900" : "bg-red-600"}`}
        >
          {toast.msg}
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Property News Digest
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage the weekly SA property market newsletter
              {subCount !== null && (
                <span>
                  {" "}
                  · {subCount} active subscriber{subCount !== 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
          {digest && <StatusBadge status={digest.status} />}
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* ── Left panel ─────────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Digest status */}
            {digest && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Latest digest
                </p>
                <p className="text-sm font-medium text-slate-900">
                  {digest.subject ?? "Untitled"}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {digest.week_start_date} – {digest.week_end_date}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <StatusBadge status={digest.status} />
                  <span className="text-xs text-slate-400">
                    {digest.articles_count} articles
                  </span>
                </div>
                {digest.sent_at && (
                  <p className="mt-1 text-xs text-slate-400">
                    Sent{" "}
                    {new Date(digest.sent_at).toLocaleDateString("en-ZA", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-4">
                Actions
              </p>

              {/* 1. Fetch */}
              <button
                onClick={handleFetch}
                disabled={!!actionLoading}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
              >
                <span>Fetch latest news</span>
                {busy("fetch") && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                )}
              </button>

              {/* 2. Generate */}
              <button
                onClick={handleGenerate}
                disabled={!!actionLoading}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
              >
                <span>Generate weekly digest</span>
                {busy("generate") && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                )}
              </button>

              {/* 3. Test send */}
              {digest && (
                <div>
                  <button
                    onClick={() => setShowTestInput((v) => !v)}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <span>Send test email</span>
                  </button>
                  {showTestInput && (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="email"
                        placeholder="your@email.com"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                      <button
                        onClick={handleTestSend}
                        disabled={!testEmail || busy("test-send")}
                        className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        Send
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 4. Approve */}
              {digest?.status === "draft" && (
                <button
                  onClick={handleApprove}
                  disabled={!!actionLoading}
                  className="flex w-full items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-left text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
                >
                  <span>Approve digest</span>
                  {busy("approve") && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                  )}
                </button>
              )}

              {/* 5. Send */}
              {digest?.status === "approved" && (
                <button
                  onClick={handleSend}
                  disabled={!!actionLoading}
                  className="flex w-full items-center justify-between rounded-xl bg-green-600 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                >
                  <span>Send to {subCount ?? "?"} subscribers</span>
                  {busy("send") && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* ── Right panel ─────────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* HTML preview */}
            {digest?.html_content ? (
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="border-b border-slate-100 px-5 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Email preview
                  </p>
                </div>
                <iframe
                  srcDoc={digest.html_content}
                  className="h-[500px] w-full"
                  title="Digest preview"
                  sandbox="allow-same-origin"
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                <p className="text-sm text-slate-400">
                  No digest generated yet.
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  Fetch news and generate a digest to see the preview.
                </p>
              </div>
            )}

            {/* Article list */}
            {articles.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="border-b border-slate-100 px-5 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Articles in digest ({articles.length})
                  </p>
                </div>
                <div className="divide-y divide-slate-100">
                  {articles.map((a, i) => (
                    <div
                      key={a.id ?? i}
                      className="flex items-start gap-3 px-5 py-3"
                    >
                      <span className="mt-0.5 w-5 shrink-0 text-xs font-bold text-slate-400">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block truncate text-sm font-medium text-slate-900 hover:text-blue-600"
                        >
                          {a.title}
                        </a>
                        <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-slate-400">
                          {a.category && <span>{a.category}</span>}
                          {a.published_at && (
                            <span>
                              {new Date(a.published_at).toLocaleDateString(
                                "en-ZA",
                                { day: "numeric", month: "short" },
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                          a.relevance_score >= 75
                            ? "bg-green-100 text-green-700"
                            : a.relevance_score >= 50
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {a.relevance_score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
