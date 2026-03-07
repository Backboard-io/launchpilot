import Link from "next/link";

import { IcpCard } from "@/components/positioning/icp-card";
import { PositioningPreview } from "@/components/positioning/positioning-preview";
import { PricingDirectionCard } from "@/components/positioning/pricing-direction-card";

export default async function PositioningPage({
  params
}: {
  params: Promise<{ projectSlug: string }>;
}) {
  const { projectSlug } = await params;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">Positioning</h2>
          <p className="text-sm text-slate-600">Pick ICP, wedge, and core message before execution.</p>
        </div>
        <Link href={`/app/projects/${projectSlug}/execution`} className="rounded-md bg-brand-600 px-3 py-2 text-sm text-white">
          Save and Continue
        </Link>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <IcpCard icp="CS students shipping portfolio tools" selected />
          <IcpCard icp="Indie developers with early SaaS MVPs" />
          <IcpCard icp="Solo technical founders testing niche tools" />
        </div>
        <div className="space-y-3">
          <PositioningPreview
            headline="Turn your side project into first users"
            subheadline="Research, position, and execute with supervised outbound."
            statement="For technical builders with weak GTM skills, Growth Launchpad creates a concrete first-user launch system."
            benefits={["Narrow ICP and wedge", "Actionable 7-day plan", "Approval-gated execution"]}
          />
          <PricingDirectionCard value="Free + optional paid launch sprint" />
        </div>
      </div>
    </div>
  );
}
