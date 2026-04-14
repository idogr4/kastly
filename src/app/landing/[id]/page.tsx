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
    .select("id, business_name, campaign_data")
    .eq("id", id)
    .single();

  if (!campaign || !campaign.campaign_data?.landing_page) {
    notFound();
  }

  const lp = campaign.campaign_data.landing_page;

  return (
    <LandingClient
      campaignId={campaign.id}
      businessName={campaign.business_name}
      headline={lp.hero_headline}
      subheadline={lp.hero_subheadline}
      features={lp.features || []}
      cta={lp.cta}
    />
  );
}
