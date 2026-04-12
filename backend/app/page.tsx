import Nav from "./components/Nav";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <Nav />

      {/* ─── HERO ─── */}
      <section className="px-6 pt-[140px] pb-16 text-center">
        <div className="mx-auto max-w-[1100px]">
          <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-[#fecaca] bg-[#fef2f2] py-1.5 pr-3.5 pl-2 text-[13px] font-medium text-[#ef4444]">
            <span className="animate-blink h-2 w-2 rounded-full bg-[#ef4444]" />
            2026 Visa VAMP &amp; Mastercard ECM thresholds now active
          </div>

          <h1 className="mx-auto max-w-[820px] text-[40px] font-bold leading-[1.08] tracking-[-0.035em] text-[#111111] sm:text-[52px] md:text-[62px] lg:text-[72px]">
            Know before Stripe{" "}
            <span className="text-[#635bff]">freezes</span> you.
          </h1>

          <p className="mx-auto mt-6 max-w-[520px] text-[17px] leading-[1.7] text-[#666666] md:text-[18px]">
            Real-time account health monitoring that tracks your dispute ratios
            against card network limits and alerts you to hidden restrictions
            before your next payout gets held.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="/pricing"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#111111] px-7 py-3 text-[15px] font-semibold text-white no-underline transition-colors hover:bg-[#333]"
            >
              Get started
              <span aria-hidden="true">&rarr;</span>
            </a>
            <a
              href="#features"
              className="inline-flex items-center rounded-full border-[1.5px] border-[#e5e7eb] bg-transparent px-7 py-[11px] text-[15px] font-semibold text-[#111111] no-underline transition-colors hover:border-[#ccc] hover:bg-[#f9fafb]"
            >
              See how it works
            </a>
          </div>

          <p className="mt-5 flex items-center justify-center gap-1.5 font-mono text-[12px] text-[#aaaaaa]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#22c55e">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Read-only access only. We never touch your funds.
          </p>
        </div>
      </section>

      {/* ─── DASHBOARD PREVIEW ─── */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-[960px]">
          <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-[#fafafa] shadow-[0_8px_60px_-12px_rgba(0,0,0,0.1)]">
            {/* Window chrome */}
            <div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-3 text-[12px] text-[#aaaaaa]">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#e5e7eb]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#e5e7eb]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#e5e7eb]" />
                </div>
                <span className="font-medium text-[#999999]">ShieldScore Dashboard</span>
              </div>
              <span className="font-mono text-[11px]">Live preview</span>
            </div>

            {/* Dashboard body */}
            <div className="p-5 md:p-7">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <div className="font-mono text-[48px] font-semibold leading-none text-[#22c55e] md:text-[56px]">
                    87
                  </div>
                  <div className="mt-1.5 text-[13px] text-[#999999]">Account health score</div>
                </div>
                <div className="rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-3.5 py-1 text-[12px] font-semibold text-[#16a34a]">
                  Healthy
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-[#e5e7eb] bg-white p-4">
                  <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[#aaaaaa]">
                    Dispute ratio
                  </div>
                  <div className="font-mono text-[24px] font-semibold text-[#22c55e]">0.32%</div>
                  <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-[#f3f4f6]">
                    <div className="h-1 rounded-full bg-[#22c55e]" style={{ width: "21%" }} />
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-[#bbbbbb]">VAMP limit: 1.50%</div>
                </div>

                <div className="rounded-xl border border-[#e5e7eb] bg-white p-4">
                  <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[#aaaaaa]">
                    Fraud ratio
                  </div>
                  <div className="font-mono text-[24px] font-semibold text-[#eab308]">0.71%</div>
                  <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-[#f3f4f6]">
                    <div className="h-1 rounded-full bg-[#eab308]" style={{ width: "71%" }} />
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-[#bbbbbb]">CMM warning: 1.00%</div>
                </div>

                <div className="rounded-xl border border-[#e5e7eb] bg-white p-4">
                  <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[#aaaaaa]">
                    Restrictions
                  </div>
                  <div className="font-mono text-[24px] font-semibold text-[#22c55e]">None</div>
                  <div className="mt-1 font-mono text-[10px] text-[#bbbbbb]">Last checked: 2m ago</div>
                </div>
              </div>

              {/* Recent activity */}
              <div className="mt-4 rounded-xl border border-[#e5e7eb] bg-white p-4">
                <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.08em] text-[#aaaaaa]">
                  Recent activity
                </div>
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                      <span className="text-[#666666]">Daily health check passed</span>
                    </div>
                    <span className="font-mono text-[11px] text-[#bbbbbb]">2m ago</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#eab308]" />
                      <span className="text-[#666666]">Fraud ratio increased 0.12%</span>
                    </div>
                    <span className="font-mono text-[11px] text-[#bbbbbb]">1h ago</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                      <span className="text-[#666666]">No new restrictions detected</span>
                    </div>
                    <span className="font-mono text-[11px] text-[#bbbbbb]">3h ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PROBLEM ─── */}
      <section className="border-t border-[#f0f0f0] px-6 py-24 md:py-28">
        <div className="mx-auto max-w-[1100px]">
          <div className="grid items-start gap-16 md:grid-cols-2">
            <div>
              <h2 className="text-[32px] font-bold leading-[1.15] tracking-[-0.025em] text-[#111111] md:text-[38px]">
                Stripe doesn&apos;t warn you. They just act.
              </h2>
              <p className="mt-5 text-[16px] leading-[1.8] text-[#777777]">
                One morning your account works fine. By afternoon, your payouts
                are frozen, your reserves are held for 90 days, and you&apos;re
                scrambling to keep your business alive. Stripe monitors your
                chargeback ratios and fraud patterns constantly, but they never
                share what they see. You find out when it&apos;s already too late.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-6">
                <div className="font-mono text-[30px] font-bold text-[#ef4444]">1.3 stars</div>
                <div className="mt-1 text-[14px] text-[#666666]">
                  Stripe&apos;s Trustpilot rating, driven by sudden account freezes
                </div>
              </div>
              <div className="rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-6">
                <div className="font-mono text-[30px] font-bold text-[#ef4444]">1,200+</div>
                <div className="mt-1 text-[14px] text-[#666666]">
                  BBB complaints about withheld funds in the last 3 years
                </div>
              </div>
              <div className="rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-6">
                <div className="font-mono text-[30px] font-bold text-[#ef4444]">90-180 days</div>
                <div className="mt-1 text-[14px] text-[#666666]">
                  Typical rolling reserve hold when flagged for review
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="px-6 py-24 md:py-28">
        <div className="mx-auto max-w-[1100px]">
          <div className="mb-3 text-center text-[13px] font-semibold uppercase tracking-[0.1em] text-[#635bff]">
            What ShieldScore monitors
          </div>
          <h2 className="mx-auto mb-4 max-w-[500px] text-center text-[32px] font-bold leading-[1.15] tracking-[-0.025em] md:text-[38px]">
            Your early warning system for Stripe.
          </h2>
          <p className="mx-auto mb-14 max-w-[460px] text-center text-[16px] leading-[1.7] text-[#888888]">
            We watch the signals Stripe never shows you, so you can fix problems
            before they become account freezes.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="group rounded-2xl border border-[#e5e7eb] p-8 transition-all hover:border-[#ccc] hover:shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)]">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#635bff]/[0.08]">
                <svg className="h-5 w-5 text-[#635bff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <path d="M7 16l4-8 4 4 5-9" />
                </svg>
              </div>
              <h3 className="mb-2 text-[18px] font-semibold tracking-[-0.01em]">
                Card network compliance tracking
              </h3>
              <p className="text-[14px] leading-[1.7] text-[#777777]">
                Real-time monitoring of your dispute and fraud ratios against
                Visa&apos;s VAMP threshold and Mastercard&apos;s CMM/ECM
                programs. See exactly where you stand, every day.
              </p>
            </div>

            <div className="group rounded-2xl border border-[#e5e7eb] p-8 transition-all hover:border-[#ccc] hover:shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)]">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#635bff]/[0.08]">
                <svg className="h-5 w-5 text-[#635bff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
              </div>
              <h3 className="mb-2 text-[18px] font-semibold tracking-[-0.01em]">
                Hidden restriction alerts
              </h3>
              <p className="text-[14px] leading-[1.7] text-[#777777]">
                Monitors Stripe&apos;s <code className="rounded bg-[#f5f5f5] px-1 py-0.5 font-mono text-[12px] text-[#555555]">account.updated</code> webhook
                for silent KYC requests and capability changes. Get alerted the
                moment Stripe flags your account.
              </p>
            </div>

            <div className="group rounded-2xl border border-[#e5e7eb] p-8 transition-all hover:border-[#ccc] hover:shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)]">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#635bff]/[0.08]">
                <svg className="h-5 w-5 text-[#635bff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <h3 className="mb-2 text-[18px] font-semibold tracking-[-0.01em]">
                Velocity anomaly detection
              </h3>
              <p className="text-[14px] leading-[1.7] text-[#777777]">
                Catches sudden spikes in transaction velocity, excessive
                declines, and card-testing bot patterns that trigger
                Stripe&apos;s automated suspension algorithms.
              </p>
            </div>

            <div className="group rounded-2xl border border-[#e5e7eb] p-8 transition-all hover:border-[#ccc] hover:shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)]">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#635bff]/[0.08]">
                <svg className="h-5 w-5 text-[#635bff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <h3 className="mb-2 text-[18px] font-semibold tracking-[-0.01em]">
                Remediation playbooks
              </h3>
              <p className="text-[14px] leading-[1.7] text-[#777777]">
                If you breach a threshold, get auto-generated remediation plans
                with the exact corrective steps Stripe expects: 3D Secure, Radar
                rules, and evidence templates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="border-t border-[#f0f0f0] px-6 py-24 text-center md:py-28">
        <div className="mx-auto max-w-[600px]">
          <h2 className="text-[32px] font-bold leading-[1.15] tracking-[-0.025em] text-[#111111] md:text-[40px]">
            Don&apos;t find out the hard way.
          </h2>
          <p className="mt-4 text-[16px] leading-[1.7] text-[#777777]">
            Start monitoring your Stripe account health today. Setup takes less
            than 60 seconds.
          </p>
          <a
            href="/pricing"
            className="mt-9 inline-flex items-center gap-1.5 rounded-full bg-[#111111] px-7 py-3 text-[15px] font-semibold text-white no-underline transition-colors hover:bg-[#333]"
          >
            See pricing
            <span aria-hidden="true">&rarr;</span>
          </a>
          <p className="mt-5 font-mono text-[12px] text-[#aaaaaa]">
            Read-only access only. We never touch your funds.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
