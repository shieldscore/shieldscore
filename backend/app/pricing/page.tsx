import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import PricingButton from "../components/PricingButton";

export const metadata: Metadata = {
  title: "Pricing | ShieldScore",
  description:
    "Simple, transparent pricing for Stripe account health monitoring. Monitor plan at $29/mo, Defend plan coming soon at $59/mo.",
};

function CheckIcon() {
  return (
    <svg
      className="h-[18px] w-[18px] shrink-0 text-[#22c55e]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <Nav />

      <section className="px-6 pt-[140px] pb-[100px]">
        <div className="mx-auto max-w-[1100px]">
          <div className="mb-3 text-center text-[13px] font-semibold uppercase tracking-[0.1em] text-[#635bff]">
            Simple pricing
          </div>
          <h1 className="mb-3 text-center text-[32px] font-bold tracking-[-0.025em] md:text-[42px]">
            Cheaper than one frozen payout.
          </h1>
          <p className="mx-auto mb-14 max-w-[480px] text-center text-[17px] leading-[1.7] text-[#555555]">
            Read-only access. We never touch your funds. Cancel anytime.
          </p>

          <div className="mx-auto grid max-w-[720px] gap-5 md:grid-cols-2">
            {/* Monitor */}
            <div className="relative rounded-2xl border-2 border-[#111111] p-9">
              <span className="absolute -top-[11px] left-1/2 -translate-x-1/2 rounded-full bg-[#111111] px-3.5 py-[3px] text-[11px] font-semibold uppercase tracking-[0.04em] text-white">
                Available now
              </span>
              <div className="mb-2 text-[15px] font-medium text-[#555555]">Monitor</div>
              <div className="mb-1 text-[48px] font-bold">
                $29<span className="text-base font-normal text-[#888888]">/mo</span>
              </div>
              <div className="mb-7 text-sm text-[#888888]">
                Essential protection for growing businesses
              </div>
              <ul className="mb-7 list-none space-y-0">
                {[
                  "Real-time VAMP, CMM & ECM tracking",
                  "Composite health score (0 to 100)",
                  "Hidden restriction email alerts",
                  "Daily health score updates",
                  "30-day trend history",
                ].map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2.5 border-b border-[#e5e7eb] py-2.5 text-[15px] text-[#555555]"
                  >
                    <CheckIcon />
                    {f}
                  </li>
                ))}
              </ul>
              <PricingButton variant="filled">
                Install from Stripe
              </PricingButton>
            </div>

            {/* Defend */}
            <div className="relative rounded-2xl border border-[#e5e7eb] p-9">
              <span className="absolute -top-[11px] left-1/2 -translate-x-1/2 rounded-full bg-[#888888] px-3.5 py-[3px] text-[11px] font-semibold uppercase tracking-[0.04em] text-white">
                Coming soon
              </span>
              <div className="mb-2 text-[15px] font-medium text-[#555555]">Defend</div>
              <div className="mb-1 text-[48px] font-bold text-[#bbbbbb]">
                $59<span className="text-base font-normal text-[#cccccc]">/mo</span>
              </div>
              <div className="mb-7 text-sm text-[#888888]">
                Full defense system for scaling businesses
              </div>
              <ul className="mb-7 list-none space-y-0">
                {[
                  "Everything in Monitor",
                  "Slack & SMS instant alerts",
                  "Velocity anomaly detection",
                  "Remediation plan generator",
                  "90-day trend history & exports",
                  "Suggested refund alerts",
                ].map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2.5 border-b border-[#e5e7eb] py-2.5 text-[15px] text-[#999999]"
                  >
                    <CheckIcon />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="flex w-full cursor-not-allowed items-center justify-center rounded-[10px] border-[1.5px] border-[#e5e7eb] py-3.5 text-[15px] font-semibold text-[#bbbbbb]">
                Coming soon
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-[13px] text-[#aaaaaa]">
            Prices do not include applicable taxes. Install directly from the
            Stripe App Marketplace.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
