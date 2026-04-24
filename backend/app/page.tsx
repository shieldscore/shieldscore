import Nav from "./components/Nav";
import Footer from "./components/Footer";
import FaqAccordion from "./components/FaqAccordion";
import AnimateOnScroll from "./components/AnimateOnScroll";
import CountUp from "./components/CountUp";
import DashboardMockup from "./components/DashboardMockup";

const FAQ_ITEMS = [
  {
    q: "Is my data safe?",
    a: "ShieldScore uses read-only OAuth access. We can see your dispute and charge counts but cannot move funds, create charges, or access cardholder data.",
  },
  {
    q: "How does it work?",
    a: "Install ShieldScore from the Stripe App Marketplace. We pull your rolling 30-day dispute and fraud data, calculate your ratios against the Visa VAMP 1.5% and Mastercard CMM/ECM 1.0%/1.5% thresholds, and return a health score from 0 to 100.",
  },
  {
    q: "What if my score drops?",
    a: "You get an email alert when your ratios cross warning thresholds. We alert at 0.5%, 0.75%, 1.0%, and 1.5% so you have time to act before card network penalties start.",
  },
  {
    q: "Does this replace Stripe's Health Alerts?",
    a: "No. Stripe Health Alerts monitors API errors and integration health. ShieldScore monitors compliance risk: dispute ratios, fraud ratios, and hidden account restrictions. Different problems.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. No contracts, no commitment. Cancel from the Stripe App Marketplace anytime.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-[#111]">
      <Nav />

      {/* ── HERO ── */}
      <section className="px-6 pt-[120px] pb-4 md:pt-[140px] md:pb-6">
        <div className="mx-auto max-w-[1100px] text-center">
              <div className="hero-stagger-1">
                <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-[#f0fdf4] py-1.5 pr-3.5 pl-2.5 text-[13px] font-medium text-[#15803d]">
                  <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                  2026 VAMP &amp; ECM thresholds now active
                </div>

                <h1 className="mx-auto max-w-[700px] text-[36px] font-[800] leading-[1.06] tracking-[-0.02em] text-[#111] sm:text-[44px] md:text-[56px] lg:text-[72px]">
                  Know before Stripe freezes&nbsp;you.
                </h1>
              </div>

              <div className="hero-stagger-2">
                <p className="mx-auto mt-5 max-w-[560px] text-[16px] leading-[1.7] text-[#666] md:text-[18px]">
                  Track your dispute ratios against card network thresholds. Get
                  alerted to hidden account restrictions. Runs inside your Stripe
                  Dashboard.
                </p>
              </div>

              <div className="hero-stagger-3">
                <div className="mt-8">
                  <a
                    href="https://marketplace.stripe.com/apps/shieldscore"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-hover inline-flex items-center rounded-lg bg-[#111] px-8 py-3.5 text-[16px] font-semibold text-white no-underline"
                  >
                    Install from Stripe
                  </a>
                </div>
              </div>

              <div className="hero-stagger-4">
                <p className="mt-4 text-[13px] text-[#999]">
                  Read-only access. 60-second setup. Cancel anytime.
                </p>
              </div>
        </div>
      </section>

      {/* ── DASHBOARD MOCKUP ── */}
      <DashboardMockup />

      {/* ── SOCIAL PROOF ── */}
      <section className="bg-[#fafafa] px-6 py-12 md:py-20">
        <AnimateOnScroll>
          <div className="mx-auto max-w-[1100px] text-center">
            <h2 className="mx-auto max-w-[700px] text-[24px] font-bold tracking-[-0.02em] text-[#111] md:text-[36px]">
              #1 complaint on Trustpilot about Stripe: surprise account freezes.
            </h2>
            <p className="mx-auto mt-3 max-w-[560px] text-[15px] leading-[1.7] text-[#888]">
              4.8 million businesses. Zero visibility into when their next payout
              gets held.
            </p>

            <div className="mx-auto mt-12 grid max-w-[820px] gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-[#e5e5e5] bg-white p-7 text-center">
                <div className="flex items-center justify-center gap-1">
                  <CountUp
                    end={1.3}
                    decimals={1}
                    className="font-mono text-[36px] font-bold leading-none text-[#dc2626]"
                  />
                  <svg
                    className="mb-1 text-[#dc2626]"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <p className="mt-2 text-[14px] text-[#666]">
                  Trustpilot rating
                </p>
              </div>
              <div className="rounded-xl border border-[#e5e5e5] bg-white p-7 text-center">
                <div className="font-mono leading-none text-[#dc2626]">
                  <CountUp
                    end={180}
                    className="text-[36px] font-bold"
                  />
                  <span className="text-[20px] font-bold"> days</span>
                </div>
                <p className="mt-2 text-[14px] text-[#666]">
                  Maximum fund hold
                </p>
              </div>
              <div className="rounded-xl border border-[#e5e5e5] bg-white p-7 text-center">
                <div className="font-mono leading-none text-[#dc2626]">
                  <CountUp
                    end={25000}
                    prefix="$"
                    className="text-[36px] font-bold"
                  />
                  <span className="text-[20px] font-bold">+</span>
                </div>
                <p className="mt-2 text-[14px] text-[#666]">
                  Monthly ECM fine
                </p>
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="bg-[#fafafa] px-6 py-12 md:py-20">
        <AnimateOnScroll>
          <div className="mx-auto max-w-[900px]">
            <p className="mb-2 text-center font-mono text-[12px] font-medium uppercase tracking-[0.1em] text-[#999]">
              How it works
            </p>
            <h2 className="mx-auto mb-14 max-w-[600px] text-center text-[28px] font-bold tracking-[-0.02em] md:text-[36px]">
              Install. Monitor. Get&nbsp;alerted.
            </h2>

            <div className="grid gap-8 md:grid-cols-3 md:gap-12">

              {/* Step 1 */}
              <div>
                <svg width="28" height="30" viewBox="-1 -1 26 28" fill="none" className="mb-3">
                  <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="#22c55e" opacity="0.15" />
                  <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" stroke="#22c55e" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M9 12l2 2 4-4" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h3 className="mb-2 text-[18px] font-bold text-[#111]">
                  Install from Stripe
                </h3>
                <p className="text-[14px] leading-[1.6] text-[#888]">
                  One click from the Marketplace. Read-only access to disputes, charges, and account status.
                </p>
                <div className="mt-4">
                  <span className="inline-block rounded-full bg-[#f0fdf4] px-2.5 py-0.5 font-mono text-[11px] font-medium text-[#22c55e]">
                    read-only
                  </span>
                </div>
              </div>

              {/* Step 2 */}
              <div>
                <svg width="28" height="28" viewBox="-1 -1 26 26" fill="none" className="mb-3">
                  <circle cx="12" cy="12" r="10" stroke="#6b7280" strokeWidth="1.5" opacity="0.25" />
                  <path d="M12 12L12 6" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M12 12L16.5 15.5" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="1.5" fill="#111" />
                  <path d="M4.93 4.93A10 10 0 0119.07 4.93" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <h3 className="mb-2 text-[18px] font-bold text-[#111]">
                  See your ratios
                </h3>
                <p className="text-[14px] leading-[1.6] text-[#888]">
                  VAMP and ECM ratios from the rolling 30-day window. Health score from 0 to 100.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="inline-block rounded-full bg-[#f0fdf4] px-2.5 py-0.5 font-mono text-[11px] font-medium text-[#22c55e]">
                    0.91%
                  </span>
                  <span className="inline-block rounded-full bg-[#fff7ed] px-2.5 py-0.5 font-mono text-[11px] font-medium text-[#f59e0b]">
                    55/100
                  </span>
                </div>
              </div>

              {/* Step 3 */}
              <div>
                <svg width="28" height="28" viewBox="-1 -1 26 26" fill="none" className="mb-3">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="18" cy="4" r="3" fill="#ef4444" />
                </svg>
                <h3 className="mb-2 text-[18px] font-bold text-[#111]">
                  Get alerted
                </h3>
                <p className="text-[14px] leading-[1.6] text-[#888]">
                  Email when ratios cross 0.5%, 0.75%, 1.0%, or 1.5%. Or when Stripe silently flags your account.
                </p>
                <div className="mt-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff7ed] px-2.5 py-0.5 font-mono text-[11px] font-medium text-[#ea580c]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444]" />
                    Alert sent
                  </span>
                </div>
              </div>

            </div>
          </div>
        </AnimateOnScroll>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="px-6 py-12 md:py-20">
        <div className="mx-auto max-w-[1100px]">
          <AnimateOnScroll>
            <p className="mb-2 font-mono text-[12px] font-medium uppercase tracking-[0.1em] text-[#999]">
              What we monitor
            </p>
            <h2 className="mb-10 text-[28px] font-bold tracking-[-0.02em] md:text-[36px]">
              What ShieldScore monitors
            </h2>
          </AnimateOnScroll>

          {/* Hero feature */}
          <AnimateOnScroll>
            <div className="mb-4 grid items-center gap-8 rounded-2xl border border-[#e8e8e8] bg-white p-8 shadow-[0_1px_4px_rgba(0,0,0,0.03)] md:grid-cols-[1fr_280px] md:p-10">
              <div>
                <h3 className="mb-3 text-[22px] font-bold tracking-[-0.01em] text-[#111] md:text-[26px]">
                  Card network compliance tracking
                </h3>
                <p className="max-w-[440px] text-[15px] leading-[1.7] text-[#666]">
                  Your dispute ratio tracked against the Visa VAMP{" "}
                  <span className="font-mono">1.5%</span> threshold and
                  Mastercard CMM/ECM{" "}
                  <span className="font-mono">1.0%</span> /{" "}
                  <span className="font-mono">1.5%</span> programs. Calculated
                  from the rolling 30-day window. Updated daily.
                </p>
              </div>

              {/* Threshold bar visualization */}
              <div className="flex justify-center">
                <div className="w-full max-w-[260px]">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[#999]">
                    Current position
                  </div>
                  <div className="mt-2 font-mono text-[28px] font-bold text-[#22c55e]">
                    0.32%
                  </div>
                  <div className="relative mt-4">
                    <div className="flex h-3 overflow-hidden rounded-full">
                      <div className="w-1/4 bg-[#22c55e]" />
                      <div className="w-1/4 bg-[#eab308]" />
                      <div className="w-1/4 bg-[#f97316]" />
                      <div className="w-1/4 bg-[#ef4444]" />
                    </div>
                    <div
                      className="absolute top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-white bg-[#111] shadow-sm"
                      style={{ left: "16%" }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between font-mono text-[9px] text-[#aaa]">
                    <span>0%</span>
                    <span>CMM 1.0%</span>
                    <span>VAMP 1.5%</span>
                    <span>2.0%</span>
                  </div>
                </div>
              </div>
            </div>
          </AnimateOnScroll>

          {/* Secondary features: uniform styling, no colored borders */}
          <div className="grid gap-4 md:grid-cols-3">
            <AnimateOnScroll delay={0}>
              <div className="rounded-xl border border-[#e8e8e8] bg-white p-8 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                <h3 className="mb-2.5 text-[16px] font-bold text-[#111]">
                  Hidden restriction alerts
                </h3>
                <p className="text-[14px] leading-[1.65] text-[#777]">
                  Watches the{" "}
                  <code className="rounded bg-[#f5f5f5] px-1 py-0.5 font-mono text-[12px] text-[#555]">
                    account.updated
                  </code>{" "}
                  webhook for changes to{" "}
                  <code className="rounded bg-[#f5f5f5] px-1 py-0.5 font-mono text-[12px] text-[#555]">
                    requirements.currently_due
                  </code>{" "}
                  and capability status. You get an email before Stripe sends you
                  one.
                </p>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll delay={100}>
              <div className="rounded-xl border border-[#e8e8e8] bg-white p-8 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                <h3 className="mb-2.5 text-[16px] font-bold text-[#111]">
                  Velocity anomaly detection
                </h3>
                <p className="text-[14px] leading-[1.65] text-[#777]">
                  Flags when your decline rate crosses the{" "}
                  <span className="font-mono">20%</span> Visa enumeration
                  threshold. Detects card-testing bot patterns from abnormal
                  transaction velocity.
                </p>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll delay={200}>
              <div className="rounded-xl border border-[#e8e8e8] bg-white p-8 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                <h3 className="mb-2.5 text-[16px] font-bold text-[#111]">
                  Remediation playbooks
                </h3>
                <p className="text-[14px] leading-[1.65] text-[#777]">
                  If you breach a threshold, get a remediation plan with the
                  corrective steps: enable 3D Secure, configure Radar rules,
                  prepare dispute evidence templates.
                </p>
              </div>
            </AnimateOnScroll>
          </div>

        </div>
      </section>

      {/* ── ACTIONABLE INTELLIGENCE ── */}
      <section className="bg-[#fafafa] px-6 py-[60px]">
        <div className="mx-auto max-w-[800px]">
          <AnimateOnScroll>
            <p className="mb-2 font-mono text-[12px] font-medium uppercase tracking-[0.1em] text-[#999]">
              Actionable intelligence
            </p>
            <h2 className="mb-12 text-[28px] font-bold tracking-[-0.02em] md:text-[36px]">
              Go beyond monitoring
            </h2>
          </AnimateOnScroll>

          <div className="flex flex-col gap-10">

            {/* Row 1: text left, data right */}
            <AnimateOnScroll>
              <div className="grid items-start gap-8 md:grid-cols-[55%_45%] md:gap-10">
                <div>
                  <h3 className="mb-3 text-[22px] font-bold text-[#111]">
                    7-day trend tracking
                  </h3>
                  <p className="text-[14px] leading-[1.5] text-[#777]">
                    See whether your dispute ratio, fraud ratio, and decline rate are trending up, down, or flat. Every metric shows a direction arrow and the exact delta so you can spot problems early.
                  </p>
                </div>
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[#999]">
                      Dispute ratio
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="font-mono text-[22px] font-bold text-[#22c55e]">
                        0.32%
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                        <path d="M6 18L18 6M18 6H8M18 6v10" />
                      </svg>
                    </div>
                    <div className="font-mono text-[11px] text-[#22c55e]">
                      -0.04% this week
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[#999]">
                      Fraud ratio
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="font-mono text-[22px] font-bold text-[#f59e0b]">
                        0.71%
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                        <path d="M6 6L18 18M18 18V8M18 18H8" />
                      </svg>
                    </div>
                    <div className="font-mono text-[11px] text-[#ef4444]">
                      +0.12% this week
                    </div>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>

            <div className="h-px bg-[#e5e7eb]" />

            {/* Row 2: data left, text right */}
            <AnimateOnScroll>
              <div className="grid items-start gap-8 md:grid-cols-[45%_55%] md:gap-10">
                <div className="order-2 md:order-1">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between border-b border-[#e5e5e5] py-3">
                      <span className="text-[13px] text-[#666]">
                        Mastercard CMM <span className="font-mono text-[#999]">1.0%</span>
                      </span>
                      <span className="font-mono text-[15px] font-bold text-[#22c55e]">
                        47 days
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#e5e5e5] py-3">
                      <span className="text-[13px] text-[#666]">
                        Visa VAMP <span className="font-mono text-[#999]">1.5%</span>
                      </span>
                      <span className="font-mono text-[15px] font-bold text-[#22c55e]">
                        112 days
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-[13px] text-[#666]">
                        Visa enumeration <span className="font-mono text-[#999]">20%</span>
                      </span>
                      <span className="font-mono text-[15px] font-bold text-[#999]">
                        N/A
                      </span>
                    </div>
                  </div>
                </div>
                <div className="order-1 md:order-2">
                  <h3 className="mb-3 text-[22px] font-bold text-[#111]">
                    Threshold countdown
                  </h3>
                  <p className="text-[14px] leading-[1.5] text-[#777]">
                    Based on your current trend velocity, ShieldScore projects how many days until you hit each card network threshold. If your ratio is climbing, you know exactly how long you have to act.
                  </p>
                </div>
              </div>
            </AnimateOnScroll>

            <div className="h-px bg-[#e5e7eb]" />

            {/* Row 3: text left, data right */}
            <AnimateOnScroll>
              <div className="grid items-start gap-8 md:grid-cols-[55%_45%] md:gap-10">
                <div>
                  <h3 className="mb-3 text-[22px] font-bold text-[#111]">
                    Per-dispute breakdown
                  </h3>
                  <p className="text-[14px] leading-[1.5] text-[#777]">
                    See every recent dispute with the amount, reason code, and exactly how much it moved your ratio. Know which disputes cost the most and prioritize your responses.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
                      <span className="font-mono text-[13px] text-[#555]">
                        $249.00
                      </span>
                    </div>
                    <span className="font-mono text-[12px] text-[#999]">
                      +0.008%
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                      <span className="font-mono text-[13px] text-[#555]">
                        $89.00
                      </span>
                    </div>
                    <span className="font-mono text-[12px] text-[#999]">
                      +0.008%
                    </span>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>

            <div className="h-px bg-[#e5e7eb]" />

            {/* Row 4: data left, text right */}
            <AnimateOnScroll>
              <div className="grid items-start gap-8 md:grid-cols-[45%_55%] md:gap-10">
                <div className="order-2 md:order-1">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[12px] font-semibold text-[#111]">
                        product_not_received
                      </span>
                      <span className="rounded bg-[#f0fdf4] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#16a34a]">
                        ~70% win
                      </span>
                    </div>
                    <p className="mt-2 text-[12px] leading-[1.5] text-[#888]">
                      Submit tracking number, carrier, and delivery confirmation.
                    </p>
                  </div>
                </div>
                <div className="order-1 md:order-2">
                  <h3 className="mb-3 text-[22px] font-bold text-[#111]">
                    Dispute response guidance
                  </h3>
                  <p className="text-[14px] leading-[1.5] text-[#777]">
                    Every dispute comes with tailored advice based on the reason code: what evidence to submit, which Stripe fields to fill, and your estimated win rate.
                  </p>
                </div>
              </div>
            </AnimateOnScroll>

            <div className="h-px bg-[#e5e7eb]" />

            {/* Row 5: text left, data right */}
            <AnimateOnScroll>
              <div className="grid items-start gap-8 md:grid-cols-[55%_45%] md:gap-10">
                <div>
                  <h3 className="mb-3 text-[22px] font-bold text-[#111]">
                    Industry benchmarks
                  </h3>
                  <p className="text-[14px] leading-[1.5] text-[#777]">
                    Compare your dispute ratio against the average for your industry. Know whether you are performing better or worse than peers in e-commerce, SaaS, subscriptions, or travel.
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-8">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-[#999]">
                        Your ratio
                      </div>
                      <div className="font-mono text-[20px] font-bold text-[#22c55e]">
                        0.32%
                      </div>
                    </div>
                    <div className="h-8 w-px bg-[#e5e5e5]" />
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-[#999]">
                        Industry avg
                      </div>
                      <div className="font-mono text-[20px] font-bold text-[#999]">
                        0.60%
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 font-mono text-[11px] font-semibold text-[#22c55e]">
                    Below average. You are outperforming.
                  </div>
                </div>
              </div>
            </AnimateOnScroll>

          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="border-t border-[#e5e7eb] px-6 py-12 md:py-20">
        <AnimateOnScroll>
          <div className="mx-auto max-w-[640px]">
            <h2 className="mb-8 text-center text-[28px] font-bold tracking-[-0.02em] md:text-[32px]">
              Common questions
            </h2>
            <FaqAccordion items={FAQ_ITEMS} />
          </div>
        </AnimateOnScroll>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="border-t border-[#e5e7eb] bg-[#fafafa] px-6 py-12 md:py-20">
        <AnimateOnScroll>
          <div className="mx-auto max-w-[500px] text-center">
            <h2 className="text-[28px] font-bold leading-[1.15] tracking-[-0.02em] text-[#111] md:text-[36px]">
              Don&apos;t find out the hard way.
            </h2>
            <p className="mt-3 text-[15px] leading-[1.7] text-[#6b7280]">
              Start monitoring your Stripe account health. Takes 60 seconds.
            </p>
            <a
              href="https://marketplace.stripe.com/apps/shieldscore"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-hover mt-8 inline-flex items-center rounded-lg bg-[#111] px-8 py-3.5 text-[16px] font-semibold text-white no-underline"
            >
              Install from Stripe
            </a>
            <p className="mt-4 font-mono text-[13px] text-[#6b7280]">
              Read-only access. Free to start. Cancel anytime.
            </p>
          </div>
        </AnimateOnScroll>
      </section>

      <Footer />
    </div>
  );
}
