"use client";

import { useEffect, useState } from "react";

interface GalleryCampaign {
  id: string;
  business_name: string;
  industry: string | null;
  source_url: string | null;
  preview_image_url: string | null;
  campaign_data: {
    business_description?: string;
    facebook?: Array<{ headline: string; body: string }>;
    instagram?: Array<{ headline: string }>;
    persona?: { age_range?: string; tone?: string };
  } | null;
  created_at: string;
}

export default function GalleryPage() {
  const [campaigns, setCampaigns] = useState<GalleryCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function fetchGallery() {
      setLoading(true);
      try {
        const res = await fetch(`/api/gallery?page=${page}`);
        if (res.ok) {
          const data = await res.json();
          setCampaigns(data.campaigns);
          setTotalPages(data.totalPages);
        }
      } catch {
        // Silently fail — empty gallery
      } finally {
        setLoading(false);
      }
    }
    fetchGallery();
  }, [page]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <span className="text-xl font-semibold text-foreground tracking-tight">
            Kastly
          </span>
        </a>
        <div className="flex items-center gap-4">
          <a
            href="/pricing"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Pricing
          </a>
          <a
            href="/"
            className="text-sm bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors shadow-sm"
          >
            Create Campaign
          </a>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
            Campaign Gallery
          </h1>
          <p className="text-lg text-muted max-w-lg mx-auto">
            See real campaigns created by Kastly users. Get inspired, then
            create your own.
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && campaigns.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-soft flex items-center justify-center">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              No campaigns yet
            </h3>
            <p className="text-sm text-muted">
              Be the first to share a campaign in the gallery!
            </p>
            <a
              href="/"
              className="inline-block px-6 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors shadow-md"
            >
              Create Your First Campaign
            </a>
          </div>
        )}

        {/* Gallery grid */}
        {!loading && campaigns.length > 0 && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((c) => {
                const firstHeadline =
                  c.campaign_data?.facebook?.[0]?.headline ??
                  c.campaign_data?.instagram?.[0]?.headline ??
                  "";
                const firstBody =
                  c.campaign_data?.facebook?.[0]?.body ?? "";
                const desc =
                  c.campaign_data?.business_description ?? "";

                return (
                  <div
                    key={c.id}
                    className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
                  >
                    {/* Image or placeholder */}
                    <div className="aspect-[1.91/1] bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 relative overflow-hidden">
                      {c.preview_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.preview_image_url}
                          alt={c.business_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-xl">
                              {c.business_name?.[0] ?? "K"}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Industry badge */}
                      {c.industry && (
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-surface/90 backdrop-blur text-[10px] font-medium text-foreground border border-border">
                          {c.industry}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="text-base font-semibold text-foreground">
                          {c.business_name}
                        </h3>
                        {desc && (
                          <p className="text-xs text-muted mt-1 line-clamp-2">
                            {desc}
                          </p>
                        )}
                      </div>

                      {/* Sample ad copy */}
                      {firstHeadline && (
                        <div className="p-3 rounded-lg bg-background">
                          <p className="text-[10px] uppercase tracking-widest text-muted mb-1">
                            Sample Hook
                          </p>
                          <p className="text-sm font-medium text-foreground line-clamp-2">
                            {firstHeadline}
                          </p>
                          {firstBody && (
                            <p className="text-xs text-muted mt-1 line-clamp-2">
                              {firstBody}
                            </p>
                          )}
                        </div>
                      )}

                      {/* CTA */}
                      <a
                        href="/"
                        className="block w-full text-center py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-hover transition-colors shadow-sm"
                      >
                        Create a campaign for your business
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-border bg-surface hover:bg-surface-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-muted">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-border bg-surface hover:bg-surface-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
