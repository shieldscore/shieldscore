export default function Footer() {
  return (
    <footer className="px-6 pb-10 pt-20">
      <div className="mx-auto max-w-[1100px]">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          {/* Left: logo + tagline */}
          <div>
            <a
              href="/"
              className="flex items-center gap-2 text-[16px] font-bold tracking-tight text-[#111111] no-underline"
            >
              <svg viewBox="0 0 24 24" fill="#22c55e" className="h-5 w-5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              ShieldScore
            </a>
            <p className="mt-2 max-w-[280px] text-[13px] leading-relaxed text-[#999999]">
              Real-time account health monitoring for Stripe merchants.
              Read-only. We never touch your funds.
            </p>
          </div>

          {/* Right: link columns */}
          <div className="flex gap-16">
            <div>
              <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#bbbbbb]">
                Product
              </div>
              <div className="flex flex-col gap-2.5">
                <a href="/#features" className="text-[13px] text-[#777777] no-underline transition-colors hover:text-[#444444]">
                  Features
                </a>
                <a href="/pricing" className="text-[13px] text-[#777777] no-underline transition-colors hover:text-[#444444]">
                  Pricing
                </a>
              </div>
            </div>
            <div>
              <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#bbbbbb]">
                Legal
              </div>
              <div className="flex flex-col gap-2.5">
                <a href="/privacy" className="text-[13px] text-[#777777] no-underline transition-colors hover:text-[#444444]">
                  Privacy
                </a>
                <a href="/terms" className="text-[13px] text-[#777777] no-underline transition-colors hover:text-[#444444]">
                  Terms
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-[#f0f0f0] pt-6 text-[12px] text-[#bbbbbb]">
          &copy; 2026 ShieldScore. Not affiliated with Stripe, Inc. Stripe is a
          registered trademark of Stripe, Inc.
        </div>
      </div>
    </footer>
  );
}
