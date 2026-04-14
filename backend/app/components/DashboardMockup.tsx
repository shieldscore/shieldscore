"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// The mockup stays pinned on screen (sticky) inside a tall runway div.
// As the user scrolls through the runway, the inner mockup content scrolls down.
function useStickyScroll() {
  const runwayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const runway = runwayRef.current;
    const content = contentRef.current;
    const wrapper = wrapperRef.current;
    if (!runway || !content || !wrapper) return;

    const rect = runway.getBoundingClientRect();
    const windowH = window.innerHeight;

    // Calculate how much the inner content overflows the visible container.
    const contentH = content.scrollHeight;
    const visibleH = wrapper.clientHeight;
    const maxOffset = Math.max(0, contentH - visibleH);

    if (maxOffset === 0) return;

    const scrolled = -rect.top;
    const scrollable = rect.height - windowH;

    if (scrollable <= 0) return;

    // Use 90% of the runway for scrolling, last 10% is a brief pause.
    const scrollEnd = scrollable * 0.9;
    const progress = Math.max(0, Math.min(1, scrolled / scrollEnd));
    content.style.transform = `translateY(${-progress * maxOffset}px)`;
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return { runwayRef, contentRef, wrapperRef };
}

function useGaugeCounter(target: number, delay: number) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (started.current) return;
      started.current = true;
      let current = 0;
      const interval = setInterval(() => {
        current += 2;
        if (current >= target) {
          current = target;
          clearInterval(interval);
        }
        setValue(current);
      }, 30);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, delay]);

  return value;
}

export default function DashboardMockup() {
  const score = useGaugeCounter(55, 600);
  const circumference = 2 * Math.PI * 25;
  const { runwayRef, contentRef, wrapperRef } = useStickyScroll();

  return (
    <div ref={runwayRef} className="mt-4" style={{ height: "calc(100vh + 200px)" }}>
      <div className="sticky top-[80px] px-4 md:px-6">
        <div className="mx-auto max-w-[1000px]">
          <div ref={wrapperRef} className="mockup-scale-wrapper relative max-h-[800px] overflow-hidden md:max-h-[520px]">
            <div className="mockup-tilt mockup-chrome-enter origin-top overflow-hidden rounded-2xl border border-[#e5e5e5] bg-[#f8f8f8] shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
              {/* Browser chrome */}
              <div className="flex items-center gap-3 border-b border-[#e5e5e5] bg-[#f8f8f8] px-4 py-2">
                <div className="flex gap-1.5">
                  <span className="h-[10px] w-[10px] rounded-full bg-[#ff5f57]" />
                  <span className="h-[10px] w-[10px] rounded-full bg-[#febc2e]" />
                  <span className="h-[10px] w-[10px] rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 rounded bg-white px-3 py-1 text-center font-mono text-[11px] text-[#999]">
                  dashboard.stripe.com/apps/shieldscore
                </div>
              </div>

              {/* Scroll-linked content wrapper */}
              <div
                ref={contentRef}
                className="bg-white p-3 will-change-transform md:p-3.5"
                style={{ transition: "transform 0.15s ease-out" }}
              >
                <div className="mx-auto max-w-[960px]">
                  {/* ROW 1: Health Score + 30-Day Summary */}
                  <div className="mockup-row1 grid grid-cols-1 gap-2.5 md:grid-cols-[1.5fr_1fr]">
                    {/* Card 1: Account Health Score */}
                    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-3.5">
                      <div className="font-mono text-[9px] font-medium uppercase tracking-[0.08em] text-[#999]">
                        Account Health Score
                      </div>
                      <div className="mt-2 flex items-center gap-4">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-[36px] font-bold leading-none tracking-tight text-[#111]">
                            {score}
                          </span>
                          <span className="mockup-badge-pop rounded-full bg-[#fefce8] px-2 py-0.5 text-[9px] font-semibold text-[#a16207]">
                            Caution
                          </span>
                        </div>
                        {/* Gauge */}
                        <div className="mockup-gauge-fade ml-auto shrink-0">
                          <svg width="60" height="60" viewBox="0 0 60 60">
                            <circle cx="30" cy="30" r="25" fill="none" stroke="#f0f0f0" strokeWidth="5" />
                            <circle
                              cx="30"
                              cy="30"
                              r="25"
                              fill="none"
                              stroke="#f59e0b"
                              strokeWidth="5"
                              strokeLinecap="round"
                              strokeDasharray={circumference}
                              strokeDashoffset={circumference - (circumference * score) / 100}
                              transform="rotate(-90 30 30)"
                              style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)" }}
                            />
                            <text x="30" y="33" textAnchor="middle" className="font-mono text-[11px] font-bold" fill="#111">
                              {score}
                            </text>
                          </svg>
                        </div>
                      </div>
                      <div className="mt-1.5">
                        <span className="font-mono text-[9px] text-[#ccc]">Apr 13, 4:50 PM</span>
                      </div>
                    </div>

                    {/* Card 2: 30-Day Summary */}
                    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-3.5">
                      <div className="font-mono text-[9px] font-medium uppercase tracking-[0.08em] text-[#999]">
                        30-Day Summary
                      </div>
                      <div className="mt-2 flex flex-col">
                        <div className="flex items-center justify-between border-b border-[#f5f5f5] py-1.5">
                          <span className="text-[11px] text-[#888]">Charges</span>
                          <span className="font-mono text-[12px] font-bold text-[#111]">3,280</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-[#f5f5f5] py-1.5">
                          <span className="text-[11px] text-[#888]">Disputes</span>
                          <span className="font-mono text-[12px] font-bold text-[#111]">30</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-[#f5f5f5] py-1.5">
                          <span className="text-[11px] text-[#888]">Fraud warnings</span>
                          <span className="font-mono text-[12px] font-bold text-[#111]">9</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5">
                          <span className="text-[11px] text-[#888]">Restrictions</span>
                          <span className="flex items-center gap-1 font-mono text-[12px] font-bold text-[#22c55e]">
                            <span className="h-[5px] w-[5px] rounded-full bg-[#22c55e]" />
                            None
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ROW 2: Dispute Ratio + Fraud Ratio + Decline Rate */}
                  <div className="mockup-row2 mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                    {/* Card 3: Dispute Ratio */}
                    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] font-medium uppercase tracking-[0.08em] text-[#999]">
                          Dispute Ratio
                        </span>
                        <span className="rounded-full bg-[#f0fdf4] px-1.5 py-0.5 text-[8px] font-semibold text-[#16a34a]">
                          Safe
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="font-mono text-[22px] font-bold leading-none text-[#22c55e]">
                          0.91%
                        </span>
                        <svg className="mockup-sparkline-a ml-auto" width="50" height="16" viewBox="0 0 60 20" fill="none">
                          <polyline
                            points="0,16 10,14 20,15 30,12 40,10 50,8 60,6"
                            stroke="#ef4444"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <div className="mt-0.5 font-mono text-[9px] text-[#ef4444]">+0.18% / 7d</div>
                      {/* Progress bar */}
                      <div className="relative mt-2">
                        <div className="h-[3px] w-full rounded-full bg-[#f0f0f0]">
                          <div className="mockup-bar-a h-[3px] rounded-full bg-[#22c55e]" style={{ width: "60%" }} />
                        </div>
                        <div className="absolute -top-[1px] -bottom-[1px] w-px bg-[#d4d4d4]" style={{ left: "67%" }} />
                        <div className="absolute -top-[1px] -bottom-[1px] w-px bg-[#d4d4d4]" style={{ left: "100%" }} />
                        <div className="mt-0.5 flex justify-between">
                          <span />
                          <span className="absolute -translate-x-1/2 font-mono text-[7px] text-[#ccc]" style={{ left: "67%" }}>
                            CMM 1.00%
                          </span>
                          <span className="font-mono text-[7px] text-[#ccc]">VAMP 1.50%</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 4: Fraud Ratio (VAMP) */}
                    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] font-medium uppercase tracking-[0.08em] text-[#999]">
                          Fraud Ratio (VAMP)
                        </span>
                        <span className="rounded-full bg-[#fefce8] px-1.5 py-0.5 text-[8px] font-semibold text-[#a16207]">
                          Warning
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <span className="font-mono text-[22px] font-bold leading-none text-[#f59e0b]">
                          1.19%
                        </span>
                      </div>
                      <div className="mt-0.5 font-mono text-[9px] text-[#ef4444]">+0.23% / 7d</div>
                      <div className="mt-1.5 text-[9px] text-[#bbb]">Combined VAMP threshold: 1.50%</div>
                      <svg className="mockup-sparkline-b mt-1.5" width="100%" height="16" viewBox="0 0 80 20" fill="none" preserveAspectRatio="none">
                        <polyline
                          points="0,18 12,15 24,14 36,12 48,10 60,7 72,5 80,3"
                          stroke="#f59e0b"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    {/* Card 5: Decline Rate */}
                    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-3.5 max-sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] font-medium uppercase tracking-[0.08em] text-[#999]">
                          Decline Rate
                        </span>
                        <span className="rounded-full bg-[#f0fdf4] px-1.5 py-0.5 text-[8px] font-semibold text-[#16a34a]">
                          Safe
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <span className="font-mono text-[22px] font-bold leading-none text-[#111]">
                          12.53%
                        </span>
                      </div>
                      <div className="mt-0.5 font-mono text-[9px] text-[#ef4444]">+2.24% / 7d</div>
                      <div className="mt-1.5 text-[9px] text-[#bbb]">Enumeration threshold: 20.00%</div>
                    </div>
                  </div>

                  {/* ROW 3: Threshold Countdown + Week over Week */}
                  <div className="mockup-row3 mt-2.5 grid grid-cols-1 gap-2.5 md:grid-cols-2">
                    {/* Card 6: Threshold Countdown */}
                    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-3.5">
                      <div className="font-mono text-[9px] font-medium uppercase tracking-[0.08em] text-[#999]">
                        Threshold Countdown
                      </div>
                      <div className="mt-0.5 text-[9px] text-[#ccc]">Days until breach at current trajectory</div>
                      <div className="mt-2 flex flex-col gap-1.5">
                        <div className="mockup-cd-1 flex items-center justify-between rounded-lg border border-[#f0f0f0] px-2.5 py-1.5">
                          <div className="flex items-center gap-1.5">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5">
                              <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                            <span className="text-[10px] text-[#555]">Mastercard CMM 1.0%</span>
                          </div>
                          <span className="rounded-full bg-[#fef2f2] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#dc2626]">4d</span>
                        </div>
                        <div className="mockup-cd-2 flex items-center justify-between rounded-lg border border-[#f0f0f0] px-2.5 py-1.5">
                          <div className="flex items-center gap-1.5">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a16207" strokeWidth="2.5">
                              <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                            <span className="text-[10px] text-[#555]">Visa VAMP 1.5%</span>
                          </div>
                          <span className="rounded-full bg-[#fefce8] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#a16207]">23d</span>
                        </div>
                        <div className="mockup-cd-3 flex items-center justify-between rounded-lg border border-[#f0f0f0] px-2.5 py-1.5">
                          <div className="flex items-center gap-1.5">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a16207" strokeWidth="2.5">
                              <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                            <span className="text-[10px] text-[#555]">Visa Enumeration 20%</span>
                          </div>
                          <span className="rounded-full bg-[#fefce8] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#a16207]">24d</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 7: Week over Week */}
                    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-3.5">
                      <div className="font-mono text-[9px] font-medium uppercase tracking-[0.08em] text-[#999]">
                        Week over Week
                      </div>
                      <div className="mt-2">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-[#f0f0f0]">
                              <th className="pb-1.5 text-[8px] font-medium uppercase tracking-wider text-[#ccc]" />
                              <th className="pb-1.5 text-right text-[8px] font-medium uppercase tracking-wider text-[#ccc]">This wk</th>
                              <th className="pb-1.5 text-right text-[8px] font-medium uppercase tracking-wider text-[#ccc]">Last wk</th>
                              <th className="pb-1.5 text-right text-[8px] font-medium uppercase tracking-wider text-[#ccc]">Change</th>
                            </tr>
                          </thead>
                          <tbody className="font-mono text-[9px]">
                            <tr className="border-b border-[#f5f5f5]">
                              <td className="py-1.5 text-[9px] text-[#666]">Dispute ratio</td>
                              <td className="py-1.5 text-right text-[#111]">0.80%</td>
                              <td className="py-1.5 text-right text-[#999]">0.66%</td>
                              <td className="py-1.5 text-right text-[#ef4444]">+0.14%</td>
                            </tr>
                            <tr className="border-b border-[#f5f5f5]">
                              <td className="py-1.5 text-[9px] text-[#666]">Fraud ratio</td>
                              <td className="py-1.5 text-right text-[#111]">1.04%</td>
                              <td className="py-1.5 text-right text-[#999]">0.84%</td>
                              <td className="py-1.5 text-right text-[#ef4444]">+0.20%</td>
                            </tr>
                            <tr className="border-b border-[#f5f5f5]">
                              <td className="py-1.5 text-[9px] text-[#666]">Decline rate</td>
                              <td className="py-1.5 text-right text-[#111]">11.48%</td>
                              <td className="py-1.5 text-right text-[#999]">8.45%</td>
                              <td className="py-1.5 text-right text-[#ef4444]">+3.03%</td>
                            </tr>
                            <tr>
                              <td className="py-1.5 text-[9px] text-[#666]">Health score</td>
                              <td className="py-1.5 text-right text-[#111]">63</td>
                              <td className="py-1.5 text-right text-[#999]">85</td>
                              <td className="py-1.5 text-right text-[#ef4444]">-22pts</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* ROW 4: Velocity Alert + Recent Disputes + Industry Benchmark */}
                  <div className="mockup-row4 mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                    {/* Card 8: Velocity Alert */}
                    <div className="rounded-2xl border border-[#e5e7eb] border-l-[4px] border-l-[#f59e0b] bg-white p-3.5">
                      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#f59e0b]">
                        Velocity: Elevated
                      </div>
                      <p className="mt-1.5 text-[11px] leading-[1.5] text-[#555]">
                        Decline count today (470) is 2.1 standard deviations above your 30-day average (256).
                      </p>
                      <div className="mt-1.5 font-mono text-[10px] text-[#111]">
                        Declines today: 470 (avg: 256)
                      </div>
                      <p className="mt-1.5 text-[10px] leading-[1.5] text-[#bbb]">
                        Review Radar logs. Consider enabling CAPTCHA or rate limiting.
                      </p>
                    </div>

                    {/* Card 9: Recent Disputes */}
                    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-3.5">
                      <div className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-[#999]">
                        Recent Disputes
                      </div>
                      <div className="mt-2 flex flex-col gap-2">
                        <div className="rounded-lg border border-[#f0f0f0] p-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[11px] font-bold text-[#111]">$127.00</span>
                            <span className="rounded-full bg-[#f0fdf4] px-1.5 py-0.5 text-[8px] font-semibold text-[#16a34a]">low</span>
                          </div>
                          <div className="mt-0.5 text-[9px] text-[#999]">general</div>
                          <div className="mt-0.5 font-mono text-[9px] text-[#ccc]">+0.030% impact, Apr 13</div>
                        </div>
                        <div className="rounded-lg border border-[#f0f0f0] p-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[11px] font-bold text-[#111]">$89.00</span>
                            <span className="rounded-full bg-[#fefce8] px-1.5 py-0.5 text-[8px] font-semibold text-[#a16207]">med</span>
                          </div>
                          <div className="mt-0.5 text-[9px] text-[#999]">product_not_received</div>
                          <div className="mt-0.5 font-mono text-[9px] text-[#ccc]">+0.027% impact, Apr 12</div>
                        </div>
                      </div>
                    </div>

                    {/* Card 10: Industry Benchmark */}
                    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-3.5 max-sm:col-span-2">
                      <div className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-[#999]">
                        Industry Benchmark
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex-1">
                          <div className="text-[9px] text-[#bbb]">Your ratio</div>
                          <div className="mt-0.5 font-mono text-[20px] font-bold text-[#f59e0b]">0.91%</div>
                        </div>
                        <div className="h-8 w-px bg-[#f0f0f0]" />
                        <div className="flex-1">
                          <div className="text-[9px] text-[#bbb]">E-commerce General</div>
                          <div className="mt-0.5 font-mono text-[20px] font-bold text-[#d4d4d4]">0.60%</div>
                        </div>
                      </div>
                      <div className="mt-1.5 text-center font-mono text-[10px] font-semibold text-[#f59e0b]">
                        Above industry average
                      </div>
                    </div>
                  </div>

                  {/* ROW 5: 30-Day Trends (full width) */}
                  <div className="mockup-row5 mt-2.5">
                    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-3.5">
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-[#999]">
                          30-Day Trends
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <span className="h-[5px] w-[5px] rounded-full bg-[#22c55e]" />
                            <span className="text-[8px] text-[#999]">Dispute %</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="h-[5px] w-[5px] rounded-full bg-[#635bff]" />
                            <span className="text-[8px] text-[#999]">Health Score</span>
                          </div>
                        </div>
                      </div>
                      <div className="relative mt-2">
                        <svg className="w-full" height="70" viewBox="0 0 500 70" fill="none" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="dGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.08" />
                              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          {/* CMM 1.0% dashed line */}
                          <line x1="0" y1="23" x2="500" y2="23" stroke="#e5e5e5" strokeWidth="1" strokeDasharray="4 4" />
                          {/* VAMP 1.5% dashed line */}
                          <line x1="0" y1="7" x2="500" y2="7" stroke="#e5e5e5" strokeWidth="1" strokeDasharray="4 4" />
                          {/* Dispute % line */}
                          <polyline
                            points="0,44 50,42 100,40 150,38 200,36 250,34 300,32 350,30 400,28 450,26 500,24"
                            stroke="#22c55e"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <polygon
                            points="0,44 50,42 100,40 150,38 200,36 250,34 300,32 350,30 400,28 450,26 500,24 500,70 0,70"
                            fill="url(#dGrad)"
                          />
                          {/* Health Score line */}
                          <polyline
                            points="0,12 50,13 100,14 150,16 200,20 250,24 300,28 350,33 400,37 450,40 500,42"
                            stroke="#635bff"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {/* Threshold labels on right */}
                        <div className="absolute top-[3px] right-0 font-mono text-[7px] text-[#d4d4d4]">VAMP 1.5%</div>
                        <div className="absolute top-[19px] right-0 font-mono text-[7px] text-[#d4d4d4]">CMM 1.0%</div>
                      </div>
                      {/* X-axis */}
                      <div className="mt-1 flex justify-between font-mono text-[8px] text-[#d4d4d4]">
                        <span>Mar 15</span>
                        <span>Mar 22</span>
                        <span>Mar 29</span>
                        <span>Apr 5</span>
                        <span>Apr 13</span>
                      </div>
                    </div>
                  </div>

                  {/* Extra bottom padding */}
                  <div className="h-4" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
