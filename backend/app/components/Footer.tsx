import { LogoIcon } from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t border-[#f0f0f0] px-6 py-6">
      <div className="mx-auto flex max-w-[1100px] flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <a
          href="/"
          className="flex items-center gap-2 text-[14px] font-bold tracking-tight text-[#111] no-underline"
        >
          <LogoIcon size={18} />
          ShieldScore
        </a>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[12px] text-[#999]">
          <a
            href="/privacy"
            className="no-underline transition-colors duration-200 hover:text-[#666]"
          >
            Privacy
          </a>
          <a
            href="/terms"
            className="no-underline transition-colors duration-200 hover:text-[#666]"
          >
            Terms
          </a>
          <span>&copy; 2026 ShieldScore. Not affiliated with Stripe, Inc.</span>
        </div>
      </div>
    </footer>
  );
}
