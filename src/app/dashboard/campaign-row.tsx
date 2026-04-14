"use client";

import { useState } from "react";

interface Stats {
  views: number;
  clicks: number;
  leads: number;
}

export function CampaignRow({
  id,
  businessName,
  sourceUrl,
  previewImageUrl,
  isPublic,
  status,
  statusLabel,
  stats,
}: {
  id: string;
  businessName: string | null;
  sourceUrl: string | null;
  previewImageUrl: string | null;
  isPublic: boolean | null;
  status: string;
  statusLabel: string;
  stats: Stats;
}) {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const landingUrl =
    typeof window !== "undefined" ? `${window.location.origin}/landing/${id}` : "";

  async function copyLandingUrl() {
    try {
      await navigator.clipboard.writeText(landingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  async function exportLeads() {
    if (exporting) return;
    setExporting(true);
    try {
      const res = await fetch(`/api/leads/export?campaign_id=${id}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "הייצוא נכשל");
        return;
      }
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `kastly-leads-${id}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 2000);
    } finally {
      setExporting(false);
    }
  }

  const conversion = stats.views > 0 ? Math.round((stats.leads / stats.views) * 100) : 0;

  return (
    <div className="bg-surface border border-border rounded-xl hover:border-primary/30 transition-colors overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            {previewImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewImageUrl}
                alt=""
                className="w-12 h-12 rounded-lg object-cover shrink-0 border border-border"
              />
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-foreground truncate">
                {businessName || sourceUrl}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {sourceUrl && (
                  <p className="text-sm text-muted truncate max-w-[200px]" dir="ltr">
                    {sourceUrl}
                  </p>
                )}
                {isPublic && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-soft text-primary font-medium shrink-0">
                    פומבי
                  </span>
                )}
              </div>
            </div>
          </div>
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium shrink-0 ${
              status === "ready" || status === "published"
                ? "bg-green-100 text-green-700"
                : status === "failed"
                  ? "bg-red-100 text-red-700"
                  : "bg-purple-100 text-purple-700"
            }`}
          >
            {statusLabel}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-border">
          <MiniStat label="כניסות" value={stats.views} />
          <MiniStat label="לחיצות" value={stats.clicks} />
          <MiniStat label="לידים" value={stats.leads} />
          <MiniStat label="המרה" value={stats.views > 0 ? `${conversion}%` : "—"} />
        </div>

        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <a
            href={`/landing/${id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-background hover:bg-surface-hover text-foreground transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            פתח דף נחיתה
          </a>
          <button
            onClick={copyLandingUrl}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-background hover:bg-surface-hover text-foreground transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 015.656 0l.01.01a4 4 0 01-5.666 5.656l-.01-.01m-5.656 0a4 4 0 11-5.656-5.656l2-2" />
            </svg>
            {copied ? "הועתק" : "העתק קישור"}
          </button>
          <button
            onClick={exportLeads}
            disabled={exporting || stats.leads === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
            </svg>
            {exporting ? "מייצא..." : `ייצא לידים (${stats.leads})`}
          </button>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted uppercase tracking-wider">{label}</p>
    </div>
  );
}
