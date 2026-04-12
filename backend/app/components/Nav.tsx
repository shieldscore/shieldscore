import { LogoFull } from "./Logo";

export default function Nav() {
  return (
    <nav className="fixed top-0 right-0 left-0 z-50 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-4">
        <a href="/" className="no-underline">
          <LogoFull />
        </a>

        <div className="hidden items-center gap-6 md:flex">
          <a href="#how-it-works" className="text-[13px] font-medium text-[#666] no-underline hover:text-[#111]">How it works</a>
          <a href="#features" className="text-[13px] font-medium text-[#666] no-underline hover:text-[#111]">Monitoring</a>
          <a href="#pricing" className="text-[13px] font-medium text-[#666] no-underline hover:text-[#111]">Pricing</a>
          <a href="#faq" className="text-[13px] font-medium text-[#666] no-underline hover:text-[#111]">FAQ</a>
        </div>

        <a
          href="/pricing"
          className="btn-hover inline-flex items-center rounded-lg bg-[#111] px-5 py-2 text-[13px] font-semibold text-white no-underline"
        >
          Get started
        </a>
      </div>
    </nav>
  );
}
