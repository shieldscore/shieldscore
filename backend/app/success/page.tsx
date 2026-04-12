import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome to ShieldScore",
  description: "Your subscription is active. Install ShieldScore from the Stripe App Marketplace.",
};

export default function SuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#f0fdf4]">
        <svg
          className="h-8 w-8 text-[#22c55e]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h1 className="mb-3 text-[32px] font-bold tracking-[-0.025em] text-[#111111]">
        You&apos;re in.
      </h1>

      <p className="mb-8 max-w-md text-[17px] leading-[1.7] text-[#555555]">
        Your ShieldScore subscription is active. Install the app from the Stripe
        App Marketplace to start monitoring your account health.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href="https://marketplace.stripe.com"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#111111] px-[22px] py-2.5 text-[15px] font-semibold text-white no-underline transition-colors hover:bg-[#333]"
        >
          Open Stripe Marketplace
          <span aria-hidden="true">&rarr;</span>
        </a>
        <a
          href="/"
          className="inline-flex items-center rounded-lg border-[1.5px] border-[#e5e7eb] bg-transparent px-[22px] py-2.5 text-[15px] font-semibold text-[#111111] no-underline transition-colors hover:border-[#ccc] hover:bg-[#f9fafb]"
        >
          Back to home
        </a>
      </div>

      <p className="mt-8 text-[13px] text-[#888888]">
        Questions? Reach out to support@shieldscore.com
      </p>
    </div>
  );
}
