"use client";

import { useState } from "react";

/* ── Icons ── */

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

function DashIcon() {
  return (
    <svg
      className="h-[18px] w-[18px] shrink-0 text-[#d4d4d4]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <line x1="6" y1="12" x2="18" y2="12" />
    </svg>
  );
}

/* ── FAQ Accordion ── */

interface FaqItem {
  q: string;
  a: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    q: "Can I start free and upgrade later?",
    a: "Yes. Install for free, see your health score immediately. Upgrade anytime from within the Stripe App.",
  },
  {
    q: "How does billing work?",
    a: "Handled through the Stripe App Marketplace. Monthly or annual. Cancel anytime.",
  },
  {
    q: "Is my data safe?",
    a: "Read-only OAuth. Cannot move funds, create charges, or access cardholder data.",
  },
  {
    q: "What if I need to cancel?",
    a: "Cancel anytime. No contracts. Data deleted within 30 days.",
  },
  {
    q: "Does this replace Stripe Health Alerts?",
    a: "No. Stripe monitors API errors. ShieldScore monitors compliance risk: dispute ratios, fraud ratios, and hidden account restrictions. Different problems.",
  },
];

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="flex flex-col">
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.q} className="border-b border-[#f0f0f0]">
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full cursor-pointer items-center justify-between py-5 text-left"
            >
              <span className="pr-4 text-[16px] font-semibold text-[#111]">
                {item.q}
              </span>
              <svg
                className={`h-5 w-5 shrink-0 text-[#999] transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <div
              className={`overflow-hidden transition-all duration-200 ${isOpen ? "max-h-[500px] pb-5" : "max-h-0"}`}
            >
              <p className="text-[14px] leading-[1.8] text-[#777]">{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Feature list for cards ── */

function FeatureList({
  label,
  features,
}: {
  label?: string;
  features: string[];
}) {
  return (
    <>
      {label && (
        <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.04em] text-[#999]">
          {label}
        </p>
      )}
      <ul className="mb-7 list-none space-y-0">
        {features.map((f) => (
          <li
            key={f}
            className="flex items-center gap-2.5 border-b border-[#f0f0f0] py-2.5 text-[14px] text-[#555]"
          >
            <CheckIcon />
            {f}
          </li>
        ))}
      </ul>
    </>
  );
}

/* ── Comparison table ── */

interface ComparisonRow {
  feature: string;
  free: boolean;
  pro: boolean;
  defend: boolean;
}

const COMPARISON_ROWS: ComparisonRow[] = [
  { feature: "Health score (0 to 100)", free: true, pro: true, defend: true },
  { feature: "Dispute ratio and fraud ratio", free: true, pro: true, defend: true },
  { feature: "Threshold indicators (green/yellow/red)", free: true, pro: true, defend: true },
  { feature: "Daily updates", free: true, pro: true, defend: true },
  { feature: "Email alerts at all thresholds", free: false, pro: true, defend: true },
  { feature: "Hidden restriction detection", free: false, pro: true, defend: true },
  { feature: "7-day trend tracking with sparklines", free: false, pro: true, defend: true },
  { feature: "Threshold countdown (days until breach)", free: false, pro: true, defend: true },
  { feature: "Per-dispute breakdown with ratio impact", free: false, pro: true, defend: true },
  { feature: "Dispute response guidance with win rates", free: false, pro: true, defend: true },
  { feature: "Industry benchmarks by MCC code", free: false, pro: true, defend: true },
  { feature: "30-day trend charts", free: false, pro: true, defend: true },
  { feature: "SMS alerts via Twilio", free: false, pro: false, defend: true },
  { feature: "Velocity anomaly detection (Z-score)", free: false, pro: false, defend: true },
  { feature: "Week-over-week comparison", free: false, pro: false, defend: true },
  { feature: "Remediation plan generator", free: false, pro: false, defend: true },
  { feature: "90-day trend history", free: false, pro: false, defend: true },
  { feature: "CSV exports for compliance docs", free: false, pro: false, defend: true },
];

function ComparisonTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-[#e5e5e5]">
            <th className="py-3 pr-4 text-[13px] font-semibold uppercase tracking-[0.04em] text-[#999]">
              Feature
            </th>
            <th className="w-[100px] py-3 text-center text-[13px] font-semibold uppercase tracking-[0.04em] text-[#999]">
              Free
            </th>
            <th className="w-[100px] py-3 text-center text-[13px] font-semibold uppercase tracking-[0.04em] text-[#22c55e]">
              Pro
            </th>
            <th className="w-[100px] py-3 text-center text-[13px] font-semibold uppercase tracking-[0.04em] text-[#999]">
              Defend
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row, i) => (
            <tr key={row.feature} className={`border-b border-[#f0f0f0] ${i % 2 === 1 ? "bg-[#fafafa]" : ""}`}>
              <td className="py-2.5 pr-4 text-[14px] text-[#555]">
                {row.feature}
              </td>
              <td className="py-2.5 text-center">
                <span className="inline-flex justify-center">
                  {row.free ? <CheckIcon /> : <DashIcon />}
                </span>
              </td>
              <td className="py-2.5 text-center">
                <span className="inline-flex justify-center">
                  {row.pro ? <CheckIcon /> : <DashIcon />}
                </span>
              </td>
              <td className="py-2.5 text-center">
                <span className="inline-flex justify-center">
                  {row.defend ? <CheckIcon /> : <DashIcon />}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Billing toggle ── */

function BillingToggle({
  annual,
  onChange,
}: {
  annual: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span
        className={`text-[14px] font-medium ${!annual ? "text-[#111]" : "text-[#999]"}`}
      >
        Monthly
      </span>
      <button
        onClick={() => onChange(!annual)}
        className={`relative h-[28px] w-[50px] cursor-pointer rounded-full transition-colors duration-200 ${
          annual ? "bg-[#22c55e]" : "bg-[#d4d4d4]"
        }`}
        aria-label="Toggle annual billing"
      >
        <span
          className={`absolute top-[3px] left-[3px] h-[22px] w-[22px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
            annual ? "translate-x-[22px]" : ""
          }`}
        />
      </button>
      <span
        className={`text-[14px] font-medium ${annual ? "text-[#111]" : "text-[#999]"}`}
      >
        Annual
      </span>
      {annual && (
        <span className="rounded-full bg-[#f0fdf4] px-2.5 py-1 text-[11px] font-semibold text-[#16a34a]">
          Save 20%
        </span>
      )}
    </div>
  );
}

/* ── Main content ── */

const FREE_FEATURES_LIST = [
  "Health score (0 to 100)",
  "Current dispute ratio and fraud ratio",
  "Basic threshold indicators (green/yellow/red)",
  "Daily updates",
];

const PRO_FEATURES_LIST = [
  "Email alerts at all threshold levels",
  "Hidden restriction detection and alerts",
  "7-day trend tracking with sparklines",
  "Threshold countdown (days until breach)",
  "Per-dispute breakdown with ratio impact",
  "Dispute response guidance with win rates",
  "Industry benchmarks by MCC code",
  "30-day trend charts",
];

const DEFEND_FEATURES_LIST = [
  "SMS alerts via Twilio",
  "Velocity anomaly detection (Z-score)",
  "Week-over-week comparison",
  "Remediation plan generator",
  "90-day trend history",
  "CSV exports for compliance docs",
];

export default function PricingContent() {
  const [annual, setAnnual] = useState(true);

  const proPrice = annual ? 23 : 29;
  const proSuffix = annual ? "/mo, billed annually" : "/mo";
  const defendPrice = annual ? 47 : 59;
  const defendSuffix = annual ? "/mo, billed annually" : "/mo";

  return (
    <>
      {/* ── HERO ── */}
      <section className="px-6 pt-[140px] pb-4">
        <div className="mx-auto max-w-[600px] text-center">
          <p className="mb-3 font-mono text-[12px] font-medium uppercase tracking-[0.1em] text-[#999]">
            Pricing
          </p>
          <h1 className="mb-4 text-[36px] font-[800] leading-[1.1] tracking-[-0.025em] text-[#111] md:text-[48px]">
            Cheaper than one frozen payout.
          </h1>
          <p className="mx-auto max-w-[480px] text-[17px] leading-[1.7] text-[#666]">
            Start free. Upgrade when your business needs more protection.
            Read-only access. We never touch your funds.
          </p>
        </div>
      </section>

      {/* ── BILLING TOGGLE ── */}
      <section className="px-6 pt-8 pb-10">
        <BillingToggle annual={annual} onChange={setAnnual} />
      </section>

      {/* ── PRICING CARDS ── */}
      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-[1100px] items-stretch gap-5 md:grid-cols-3">
          {/* Free */}
          <div className="pricing-hover flex flex-col rounded-xl border border-[#e5e5e5] bg-white p-8">
            <div className="mb-1 text-[15px] font-medium text-[#555]">Free</div>
            <div className="mb-1">
              <span className="font-mono text-[48px] font-bold text-[#111]">
                $0
              </span>
            </div>
            <div className="mb-1 font-mono text-[13px] text-[#22c55e]">
              Free forever
            </div>
            <p className="mb-1 text-[14px] leading-[1.65] text-[#888]">
              See where you stand. Basic monitoring for any Stripe account.
            </p>
            <p className="mb-6 text-[12px] italic text-transparent select-none" aria-hidden="true">
              &nbsp;
            </p>
            <a
              href="https://marketplace.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-hover mb-7 flex w-full items-center justify-center rounded-[8px] border-[1.5px] border-[#e5e5e5] bg-[#f3f4f6] py-3.5 text-[15px] font-semibold text-[#111] no-underline transition-colors hover:bg-[#e5e7eb]"
            >
              Install from Stripe
            </a>
            <div className="mb-7 border-t border-[#f0f0f0]" />
            <div className="flex-1">
              <FeatureList features={FREE_FEATURES_LIST} />
            </div>
          </div>

          {/* Pro */}
          <div className="pricing-hover relative flex flex-col rounded-xl border border-[#22c55e] bg-white p-8 shadow-[0_4px_24px_rgba(34,197,94,0.08)]">
            <span className="absolute -top-[11px] left-1/2 -translate-x-1/2 rounded-full bg-[#22c55e] px-3.5 py-[3px] text-[11px] font-semibold uppercase tracking-[0.04em] text-white">
              Most popular
            </span>
            <div className="mb-1 text-[15px] font-medium text-[#555]">Pro</div>
            <div className="mb-1">
              <span className="font-mono text-[48px] font-bold text-[#111]">
                ${proPrice}
              </span>
              <span className="text-[15px] font-normal text-[#888]">
                {proSuffix}
              </span>
            </div>
            <div className={`mb-1 font-mono text-[13px] ${annual ? "text-[#999]" : "text-transparent select-none"}`} aria-hidden={!annual}>
              {annual ? "$276/year" : "\u00a0"}
            </div>
            <p className="mb-1 text-[14px] leading-[1.65] text-[#888]">
              Full visibility and alerts. Know the moment something changes.
            </p>
            <p className="mb-6 text-[12px] italic text-[#999]">
              Less than the cost of two Stripe dispute fees.
            </p>
            <a
              href="https://marketplace.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-hover mb-7 flex w-full items-center justify-center rounded-[8px] bg-[#16a34a] py-3.5 text-[15px] font-semibold text-white no-underline transition-colors hover:bg-[#15803d]"
            >
              Start with Pro
            </a>
            <div className="mb-7 border-t border-[#f0f0f0]" />
            <div className="flex-1">
              <FeatureList
                label="Everything in Free, plus"
                features={PRO_FEATURES_LIST}
              />
            </div>
          </div>

          {/* Defend */}
          <div className="pricing-hover flex flex-col rounded-xl border border-[#e5e5e5] bg-white p-8">
            <div className="mb-1 text-[15px] font-medium text-[#555]">
              Defend
            </div>
            <div className="mb-1">
              <span className="font-mono text-[48px] font-bold text-[#111]">
                ${defendPrice}
              </span>
              <span className="text-[15px] font-normal text-[#888]">
                {defendSuffix}
              </span>
            </div>
            <div className={`mb-1 font-mono text-[13px] ${annual ? "text-[#999]" : "text-transparent select-none"}`} aria-hidden={!annual}>
              {annual ? "$564/year" : "\u00a0"}
            </div>
            <p className="mb-1 text-[14px] leading-[1.65] text-[#888]">
              Full defense system for high-volume merchants scaling fast.
            </p>
            <p className="mb-6 text-[12px] italic text-[#999]">
              For merchants processing $50K+/month.
            </p>
            <a
              href="https://marketplace.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-hover mb-7 flex w-full items-center justify-center rounded-[8px] bg-[#111] py-3.5 text-[15px] font-semibold text-white no-underline transition-colors hover:bg-[#333]"
            >
              Start with Defend
            </a>
            <div className="mb-7 border-t border-[#f0f0f0]" />
            <div className="flex-1">
              <FeatureList
                label="Everything in Pro, plus"
                features={DEFEND_FEATURES_LIST}
              />
            </div>
          </div>
        </div>
        <p className="mx-auto mt-6 max-w-[500px] text-center text-[13px] text-[#999]">
          Billing is handled securely through the Stripe App Marketplace.
        </p>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section className="bg-[#fafafa] px-6 py-16 md:py-20">
        <div className="mx-auto max-w-[900px]">
          <h2 className="mb-10 text-center text-[28px] font-bold tracking-[-0.02em] text-[#111] md:text-[36px]">
            Compare plans
          </h2>
          <ComparisonTable />
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-[640px]">
          <h2 className="mb-8 text-center text-[28px] font-bold tracking-[-0.02em] text-[#111]">
            Questions about pricing
          </h2>
          <FaqSection />
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="bg-[#fafafa] px-6 py-16 md:py-20">
        <div className="mx-auto max-w-[500px] text-center">
          <h2 className="text-[28px] font-bold leading-[1.15] tracking-[-0.02em] text-[#111] md:text-[36px]">
            Don&apos;t wait for Stripe to tell you.
          </h2>
          <p className="mt-3 text-[15px] leading-[1.7] text-[#888]">
            Start monitoring your account health. Takes 60 seconds.
          </p>
          <a
            href="https://marketplace.stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-hover mt-8 inline-flex items-center rounded-[8px] bg-[#111] px-8 py-3.5 text-[16px] font-semibold text-white no-underline"
          >
            Install from Stripe
          </a>
          <p className="mt-4 text-[13px] text-[#aaa]">
            Read-only access. Free to start. Cancel anytime.
          </p>
        </div>
      </section>
    </>
  );
}
