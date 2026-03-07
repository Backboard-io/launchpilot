import Link from "next/link";

import { IcpCard } from "@/components/positioning/icp-card";
import { PositioningPreview } from "@/components/positioning/positioning-preview";
import { PricingDirectionCard } from "@/components/positioning/pricing-direction-card";

export default function PositioningPage({
  params
}: {
  params: { workspaceSlug: string; projectSlug: string };
}) {
  const { workspaceSlug, projectSlug } = params;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Positioning</h1>
          <p className="text-sm text-slate-600">Select ICP, wedge, and messaging direction.</p>
        </div>
        <Link href={`/app/workspace/${workspaceSlug}/projects/${projectSlug}/execution`} className="rounded-md bg-brand-600 px-3 py-2 text-sm text-white">
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
