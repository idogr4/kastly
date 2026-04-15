import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LandingClient } from "./landing-client";

export default async function PublicLandingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, business_name, campaign_data, preview_image_url")
    .eq("id", id)
    .single();

  if (!campaign || !campaign.campaign_data?.landing_page) {
    notFound();
  }

  const lp = campaign.campaign_data.landing_page;
  const brand = campaign.campaign_data.brand_profile || null;
  const heroImageUrl: string | null = campaign.preview_image_url || null;

  return (
    <LandingClient
      campaignId={campaign.id}
      businessName={campaign.business_name}
      content={{
        hero_eyebrow: lp.hero_eyebrow,
        hero_headline: lp.hero_headline,
        hero_subheadline: lp.hero_subheadline,
        primary_cta: lp.primary_cta,
        secondary_cta: lp.secondary_cta,
        social_proof_line: lp.social_proof_line,
        testimonial_quote: lp.testimonial_quote,
        testimonial_attribution: lp.testimonial_attribution,
        features: lp.features || [],
        how_it_works: lp.how_it_works || [],
        final_cta_headline: lp.final_cta_headline,
        final_cta_subline: lp.final_cta_subline,
        cta: lp.cta,
      }}
      brand={brand}
      heroImageUrl={heroImageUrl}
    />
  );
}
