import Nav from "./components/Nav";
import Footer from "./components/Footer";
import FaqAccordion from "./components/FaqAccordion";
import AnimateOnScroll from "./components/AnimateOnScroll";
import CountUp from "./components/CountUp";

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

function CheckIcon({ muted = false }: { muted?: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 ${muted ? "text-[#ccc]" : "text-[#22c55e]"}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

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
                    href="/pricing"
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
      <section className="mt-4 px-6 pb-20 md:pb-24">
          <div className="mx-auto max-w-[1000px]">
            <div className="mockup-tilt overflow-hidden rounded-2xl border border-[#e5e5e5] bg-[#f8f8f8] shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
              {/* Browser chrome */}
              <div className="flex items-center gap-3 border-b border-[#e5e5e5] bg-[#f8f8f8] px-4 py-2.5">
                <div className="flex gap-1.5">
                  <span className="h-[10px] w-[10px] rounded-full bg-[#ff5f57]" />
                  <span className="h-[10px] w-[10px] rounded-full bg-[#febc2e]" />
                  <span className="h-[10px] w-[10px] rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 rounded bg-white px-3 py-1 text-center font-mono text-[11px] text-[#999]">
                  dashboard.stripe.com/apps/shieldscore
                </div>
              </div>

              {/* Dashboard content */}
              <div className="bg-white p-4 md:p-6">
                <div className="grid gap-4 md:grid-cols-[1fr_240px]">
                  {/* Left column */}
                  <div className="flex flex-col gap-4">
                    {/* Health score */}
                    <div className="rounded-xl border border-[#e5e5e5] p-5">
                      <div className="font-mono text-[11px] font-medium uppercase tracking-wider text-[#999]">
                        Account Health Score
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="font-mono text-[48px] font-bold leading-none tracking-tight text-[#22c55e]">
                          87
                        </span>
                        <span className="rounded-full bg-[#f0fdf4] px-2.5 py-1 text-[11px] font-semibold text-[#16a34a]">
                          Healthy
                        </span>
                      </div>
                      <div className="mt-1 text-[12px] text-[#bbb]">
                        Updated 2 minutes ago
                      </div>
                    </div>

                    {/* Two metric cards */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {/* Dispute ratio */}
                      <div className="rounded-xl border border-[#e5e5e5] p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-[#999]">
                            Dispute ratio
                          </span>
                          <span className="rounded bg-[#f0fdf4] px-1.5 py-0.5 font-mono text-[9px] font-semibold text-[#16a34a]">
                            Safe
                          </span>
                        </div>
                        <div className="mt-2 font-mono text-[28px] font-bold leading-none text-[#22c55e]">
                          0.32%
                        </div>
                        <div className="relative mt-3 mb-5">
                          <div className="h-1.5 w-full rounded-full bg-[#f0f0f0]">
                            <div
                              className="h-1.5 rounded-full bg-[#22c55e]"
                              style={{ width: "21%" }}
                            />
                          </div>
                          <div
                            className="absolute -top-0.5 -bottom-0.5 w-px bg-[#d4d4d4]"
                            style={{ left: "67%" }}
                          />
                          <div
                            className="absolute top-[10px] -translate-x-1/2 whitespace-nowrap font-mono text-[8px] text-[#bbb]"
                            style={{ left: "67%" }}
                          >
                            VAMP 1.5%
                          </div>
                        </div>
                      </div>

                      {/* Fraud ratio */}
                      <div className="rounded-xl border border-[#e5e5e5] p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-[#999]">
                            Fraud ratio
                          </span>
                          <span className="rounded bg-[#fefce8] px-1.5 py-0.5 font-mono text-[9px] font-semibold text-[#a16207]">
                            Watch
                          </span>
                        </div>
                        <div className="mt-2 font-mono text-[28px] font-bold leading-none text-[#f59e0b]">
                          0.71%
                        </div>
                        <div className="relative mt-3 mb-5">
                          <div className="h-1.5 w-full rounded-full bg-[#f0f0f0]">
                            <div
                              className="h-1.5 rounded-full bg-[#f59e0b]"
                              style={{ width: "47%" }}
                            />
                          </div>
                          <div
                            className="absolute -top-0.5 -bottom-0.5 w-px bg-[#d4d4d4]"
                            style={{ left: "67%" }}
                          />
                          <div
                            className="absolute top-[10px] -translate-x-1/2 whitespace-nowrap font-mono text-[8px] text-[#bbb]"
                            style={{ left: "67%" }}
                          >
                            CMM 1.0%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent activity */}
                    <div className="rounded-xl border border-[#e5e5e5] p-4">
                      <div className="mb-3 font-mono text-[10px] font-medium uppercase tracking-wider text-[#999]">
                        Recent activity
                      </div>
                      <div className="flex flex-col gap-2.5">
                        <div className="flex items-center gap-2.5 text-[13px]">
                          <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-[#22c55e]" />
                          <span className="text-[#555]">
                            Daily health check passed
                          </span>
                          <span className="ml-auto font-mono text-[11px] text-[#bbb]">
                            2m ago
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 text-[13px]">
                          <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-[#f59e0b]" />
                          <span className="text-[#555]">
                            Fraud ratio increased{" "}
                            <span className="font-mono">0.12%</span>
                          </span>
                          <span className="ml-auto font-mono text-[11px] text-[#bbb]">
                            1h ago
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 text-[13px]">
                          <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-[#22c55e]" />
                          <span className="text-[#555]">
                            No new restrictions
                          </span>
                          <span className="ml-auto font-mono text-[11px] text-[#bbb]">
                            3h ago
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right column */}
                  <div className="flex flex-col gap-4">
                    {/* Stat boxes */}
                    <div className="flex flex-col gap-2">
                      <div className="rounded-lg border border-[#e5e5e5] px-4 py-3">
                        <div className="text-[11px] text-[#999]">
                          Charges (30d)
                        </div>
                        <div className="mt-0.5 font-mono text-[18px] font-bold text-[#111]">
                          12,847
                        </div>
                      </div>
                      <div className="rounded-lg border border-[#e5e5e5] px-4 py-3">
                        <div className="text-[11px] text-[#999]">
                          Disputes (30d)
                        </div>
                        <div className="mt-0.5 font-mono text-[18px] font-bold text-[#111]">
                          41
                        </div>
                      </div>
                      <div className="rounded-lg border border-[#e5e5e5] px-4 py-3">
                        <div className="text-[11px] text-[#999]">
                          Fraud warnings
                        </div>
                        <div className="mt-0.5 font-mono text-[18px] font-bold text-[#111]">
                          7
                        </div>
                      </div>
                    </div>

                    {/* Restrictions */}
                    <div className="rounded-xl border border-[#e5e5e5] p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-[#999]">
                          Restrictions
                        </span>
                        <span className="rounded bg-[#f0fdf4] px-1.5 py-0.5 font-mono text-[9px] font-semibold text-[#16a34a]">
                          Clear
                        </span>
                      </div>
                      <div className="mt-2 font-mono text-[20px] font-bold text-[#22c55e]">
                        None
                      </div>
                      <div className="mt-3 flex flex-col gap-2 text-[12px] text-[#666]">
                        <div className="flex items-center gap-2">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="2.5"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>No pending requirements</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="2.5"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>All capabilities active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </section>

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
      <section id="how-it-works" className="px-6 py-12 md:py-20">
        <AnimateOnScroll>
          <div className="mx-auto max-w-[1100px]">
            <p className="mb-2 text-center font-mono text-[12px] font-medium uppercase tracking-[0.1em] text-[#999]">
              How it works
            </p>
            <h2 className="mx-auto mb-14 max-w-[500px] text-center text-[28px] font-bold tracking-[-0.02em] md:text-[40px]">
              Install. Monitor. Get alerted.
            </h2>

            <div className="relative grid gap-12 md:grid-cols-3 md:gap-0">
              {/* Connector line */}
              <div className="absolute top-[32px] right-[16.67%] left-[16.67%] hidden h-px bg-[#e5e5e5] md:block" />

              <div className="relative flex flex-col items-center px-6 text-center">
                <div className="relative z-10 mb-4 bg-white font-mono text-[64px] font-bold leading-none text-[#e5e5e5]">
                  01
                </div>
                <h3 className="mb-2 text-[18px] font-bold text-[#111]">
                  Install from Stripe
                </h3>
                <p className="max-w-[260px] text-[15px] leading-[1.6] text-[#888]">
                  One click from the Stripe App Marketplace. Grant read-only
                  access to disputes, charges, and account status.
                </p>
              </div>

              <div className="relative flex flex-col items-center px-6 text-center">
                <div className="relative z-10 mb-4 bg-white font-mono text-[64px] font-bold leading-none text-[#e5e5e5]">
                  02
                </div>
                <h3 className="mb-2 text-[18px] font-bold text-[#111]">
                  See your ratios
                </h3>
                <p className="max-w-[260px] text-[15px] leading-[1.6] text-[#888]">
                  Your VAMP and ECM ratios calculated from the rolling 30-day
                  window. Health score from{" "}
                  <span className="font-mono">0</span> to{" "}
                  <span className="font-mono">100</span>.
                </p>
              </div>

              <div className="relative flex flex-col items-center px-6 text-center">
                <div className="relative z-10 mb-4 bg-white font-mono text-[64px] font-bold leading-none text-[#e5e5e5]">
                  03
                </div>
                <h3 className="mb-2 text-[18px] font-bold text-[#111]">
                  Get alerted
                </h3>
                <p className="max-w-[260px] text-[15px] leading-[1.6] text-[#888]">
                  Email alerts when ratios cross{" "}
                  <span className="font-mono">0.5%</span>,{" "}
                  <span className="font-mono">0.75%</span>,{" "}
                  <span className="font-mono">1.0%</span>, or{" "}
                  <span className="font-mono">1.5%</span>. Or when Stripe
                  silently flags your account.
                </p>
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="bg-[#fafafa] px-6 py-12 md:py-20">
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

          {/* ── NEW: Actionable intelligence features ── */}
          <AnimateOnScroll>
            <p className="mt-16 mb-2 font-mono text-[12px] font-medium uppercase tracking-[0.1em] text-[#999]">
              Actionable intelligence
            </p>
            <h2 className="mb-10 text-[28px] font-bold tracking-[-0.02em] md:text-[36px]">
              Go beyond monitoring
            </h2>
          </AnimateOnScroll>

          {/* Two-column hero row: trends + threshold countdown */}
          <div className="grid gap-4 md:grid-cols-2">
            <AnimateOnScroll delay={0}>
              <div className="flex h-full flex-col rounded-xl border border-[#e8e8e8] bg-white p-8 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                <h3 className="mb-2.5 text-[16px] font-bold text-[#111]">
                  7-day trend tracking
                </h3>
                <p className="text-[14px] leading-[1.65] text-[#777]">
                  See whether your dispute ratio, fraud ratio, and decline rate
                  are trending up, down, or flat over the last 7 days. Every
                  metric shows a direction arrow and the exact delta so you can
                  spot problems before they become thresholds.
                </p>
                {/* Mini visualization */}
                <div className="mt-auto flex items-end gap-6 pt-6">
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
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5">
                        <path d="M6 6L18 18M18 18V8M18 18H8" />
                      </svg>
                    </div>
                    <div className="font-mono text-[11px] text-[#f59e0b]">
                      +0.12% this week
                    </div>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll delay={100}>
              <div className="flex h-full flex-col rounded-xl border border-[#e8e8e8] bg-white p-8 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                <h3 className="mb-2.5 text-[16px] font-bold text-[#111]">
                  Threshold countdown
                </h3>
                <p className="text-[14px] leading-[1.65] text-[#777]">
                  Based on your current trend velocity, ShieldScore projects how
                  many days until you hit each card network threshold. If your
                  ratio is climbing, you&apos;ll know exactly how long you have
                  to act.
                </p>
                {/* Mini visualization */}
                <div className="mt-auto flex flex-col gap-3 pt-6">
                  <div className="flex items-center justify-between rounded-lg border border-[#e5e5e5] px-4 py-2.5">
                    <span className="text-[13px] text-[#666]">
                      Mastercard CMM{" "}
                      <span className="font-mono text-[#999]">1.0%</span>
                    </span>
                    <span className="font-mono text-[15px] font-bold text-[#f59e0b]">
                      47 days
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-[#e5e5e5] px-4 py-2.5">
                    <span className="text-[13px] text-[#666]">
                      Visa VAMP{" "}
                      <span className="font-mono text-[#999]">1.5%</span>
                    </span>
                    <span className="font-mono text-[15px] font-bold text-[#22c55e]">
                      112 days
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-[#e5e5e5] px-4 py-2.5">
                    <span className="text-[13px] text-[#666]">
                      Visa enumeration{" "}
                      <span className="font-mono text-[#999]">20%</span>
                    </span>
                    <span className="font-mono text-[15px] font-bold text-[#999]">
                      &mdash;
                    </span>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          </div>

          {/* Three-column row: disputes, guidance, benchmarks */}
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <AnimateOnScroll delay={0}>
              <div className="flex h-full flex-col rounded-xl border border-[#e8e8e8] bg-white p-8 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                <h3 className="mb-2.5 text-[16px] font-bold text-[#111]">
                  Per-dispute breakdown
                </h3>
                <p className="text-[14px] leading-[1.65] text-[#777]">
                  See every recent dispute with the amount, reason code, and
                  exactly how much it moved your ratio. Know which disputes
                  are costing you the most and prioritize your responses.
                </p>
                {/* Mini visualization */}
                <div className="mt-auto flex flex-col gap-2 pt-6">
                  <div className="flex items-center justify-between rounded border border-[#f0f0f0] px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
                      <span className="font-mono text-[12px] text-[#555]">
                        $249.00
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-[#999]">
                      +0.008%
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded border border-[#f0f0f0] px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                      <span className="font-mono text-[12px] text-[#555]">
                        $89.00
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-[#999]">
                      +0.008%
                    </span>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll delay={100}>
              <div className="flex h-full flex-col rounded-xl border border-[#e8e8e8] bg-white p-8 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                <h3 className="mb-2.5 text-[16px] font-bold text-[#111]">
                  Dispute response guidance
                </h3>
                <p className="text-[14px] leading-[1.65] text-[#777]">
                  Every dispute comes with tailored advice based on the reason
                  code: what evidence to submit, which Stripe fields to fill,
                  and your estimated win rate. Stop guessing, start winning.
                </p>
                {/* Mini visualization */}
                <div className="mt-auto pt-6">
                  <div className="rounded-lg border border-[#e5e5e5] p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-semibold text-[#111]">
                        product_not_received
                      </span>
                      <span className="rounded bg-[#f0fdf4] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#16a34a]">
                        ~70% win
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-[1.5] text-[#888]">
                      Submit tracking number, carrier, and delivery
                      confirmation...
                    </p>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll delay={200}>
              <div className="flex h-full flex-col rounded-xl border border-[#e8e8e8] bg-white p-8 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                <h3 className="mb-2.5 text-[16px] font-bold text-[#111]">
                  Industry benchmarks
                </h3>
                <p className="text-[14px] leading-[1.65] text-[#777]">
                  Compare your dispute ratio against the average for your
                  industry. Know whether you&apos;re performing better or worse
                  than peers in e-commerce, SaaS, subscriptions, or travel.
                </p>
                {/* Mini visualization */}
                <div className="mt-auto pt-6">
                  <div className="flex items-center gap-3 rounded-lg border border-[#e5e5e5] p-3">
                    <div className="flex-1">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-[#999]">
                        Your ratio
                      </div>
                      <div className="font-mono text-[18px] font-bold text-[#22c55e]">
                        0.32%
                      </div>
                    </div>
                    <div className="h-8 w-px bg-[#e5e5e5]" />
                    <div className="flex-1">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-[#999]">
                        Industry avg
                      </div>
                      <div className="font-mono text-[18px] font-bold text-[#999]">
                        0.60%
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-center font-mono text-[11px] font-semibold text-[#22c55e]">
                    Below average &mdash; you&apos;re outperforming
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="px-6 py-12 md:py-20">
        <AnimateOnScroll>
          <div className="mx-auto max-w-[1100px]">
            <p className="mb-2 text-center font-mono text-[12px] font-medium uppercase tracking-[0.1em] text-[#999]">
              Pricing
            </p>
            <h2 className="mb-3 text-center text-[28px] font-bold tracking-[-0.02em] text-[#111] md:text-[40px]">
              Cheaper than one frozen payout.
            </h2>
            <p className="mx-auto mb-14 max-w-[440px] text-center text-[15px] leading-[1.7] text-[#888]">
              Read-only access. We never touch your funds. Cancel anytime.
            </p>

            <div className="mx-auto grid max-w-[800px] gap-5 md:grid-cols-2">
              {/* Monitor */}
              <div className="pricing-hover rounded-2xl border border-[#e5e5e5] border-t-[3px] border-t-[#22c55e] bg-white p-8 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                <div className="mb-1 text-[15px] font-medium text-[#555]">
                  Monitor
                </div>
                <div className="mb-1 text-[#111]">
                  <span className="font-mono text-[48px] font-bold">$29</span>
                  <span className="text-base font-normal text-[#888]">
                    /mo
                  </span>
                </div>
                <div className="mb-7 text-[14px] text-[#888]">
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
                      className="flex items-center gap-2.5 border-b border-[#f0f0f0] py-2.5 text-[14px] text-[#555]"
                    >
                      <CheckIcon />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="/pricing"
                  className="btn-hover flex w-full items-center justify-center rounded-lg bg-[#111] py-3.5 text-[15px] font-semibold text-white no-underline"
                >
                  Install from Stripe
                </a>
              </div>

              {/* Defend */}
              <div className="pricing-hover relative rounded-2xl border border-[#e5e5e5] bg-white p-8">
                <span className="absolute -top-[11px] left-1/2 -translate-x-1/2 rounded-full bg-[#999] px-3.5 py-[3px] text-[11px] font-semibold uppercase tracking-[0.04em] text-white">
                  Coming soon
                </span>
                <div className="mb-1 text-[15px] font-medium text-[#555]">
                  Defend
                </div>
                <div className="mb-1">
                  <span className="font-mono text-[48px] font-bold text-[#bbb]">
                    $59
                  </span>
                  <span className="text-base font-normal text-[#ccc]">
                    /mo
                  </span>
                </div>
                <div className="mb-7 text-[14px] text-[#888]">
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
                      className="flex items-center gap-2.5 border-b border-[#f0f0f0] py-2.5 text-[14px] text-[#999]"
                    >
                      <CheckIcon muted />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex w-full cursor-not-allowed items-center justify-center rounded-lg border border-[#e5e5e5] py-3.5 text-[15px] font-semibold text-[#bbb]">
                  Coming soon
                </div>
              </div>
            </div>

            <p className="mt-8 text-center text-[13px] text-[#aaa]">
              Cancel anytime. Read-only access. We never touch your funds.
            </p>
          </div>
        </AnimateOnScroll>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="border-t border-[#f0f0f0] px-6 py-12 md:py-20">
        <AnimateOnScroll>
          <div className="mx-auto max-w-[640px]">
            <p className="mb-2 text-center font-mono text-[12px] font-medium uppercase tracking-[0.1em] text-[#999]">
              FAQ
            </p>
            <h2 className="mb-8 text-center text-[28px] font-bold tracking-[-0.02em] md:text-[32px]">
              Common questions
            </h2>
            <FaqAccordion items={FAQ_ITEMS} />
          </div>
        </AnimateOnScroll>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="bg-[#fafafa] px-6 py-12 md:py-20">
        <AnimateOnScroll>
          <div className="mx-auto max-w-[500px] text-center">
            <h2 className="text-[28px] font-bold leading-[1.15] tracking-[-0.02em] text-[#111] md:text-[36px]">
              Don&apos;t find out the hard way.
            </h2>
            <p className="mt-3 text-[15px] leading-[1.7] text-[#888]">
              Start monitoring your Stripe account health. Takes 60 seconds.
            </p>
            <a
              href="/pricing"
              className="btn-hover mt-8 inline-flex items-center rounded-lg bg-[#111] px-8 py-3.5 text-[16px] font-semibold text-white no-underline"
            >
              Install from Stripe
            </a>
            <p className="mt-4 font-mono text-[12px] text-[#999]">
              Read-only access. <span className="font-mono">$29</span>/mo.
              Cancel anytime.
            </p>
          </div>
        </AnimateOnScroll>
      </section>

      <Footer />
    </div>
  );
}
