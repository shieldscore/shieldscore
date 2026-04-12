"use client";

import { useState } from "react";

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 right-0 left-0 z-50 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-4">
        {/* Logo */}
        <a
          href="/"
          className="flex items-center gap-2 text-[17px] font-bold tracking-tight text-[#111111] no-underline"
        >
          <svg viewBox="0 0 24 24" fill="#22c55e" className="h-[22px] w-[22px]">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          ShieldScore
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          <a
            href="/#features"
            className="text-[14px] font-medium text-[#666666] no-underline transition-colors hover:text-[#111111]"
          >
            Features
          </a>
          <a
            href="/pricing"
            className="text-[14px] font-medium text-[#666666] no-underline transition-colors hover:text-[#111111]"
          >
            Pricing
          </a>
          <a
            href="/pricing"
            className="inline-flex items-center rounded-full bg-[#111111] px-5 py-[9px] text-[13px] font-semibold text-white no-underline transition-colors hover:bg-[#333]"
          >
            Get started
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[#666] hover:text-[#111] md:hidden"
          aria-label="Toggle menu"
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-black/[0.06] bg-white px-6 py-5 md:hidden">
          <div className="flex flex-col gap-4">
            <a
              href="/#features"
              onClick={() => setOpen(false)}
              className="text-[15px] font-medium text-[#555555] no-underline"
            >
              Features
            </a>
            <a
              href="/pricing"
              onClick={() => setOpen(false)}
              className="text-[15px] font-medium text-[#555555] no-underline"
            >
              Pricing
            </a>
            <a
              href="/pricing"
              onClick={() => setOpen(false)}
              className="mt-1 inline-flex items-center justify-center rounded-full bg-[#111111] px-5 py-2.5 text-[14px] font-semibold text-white no-underline"
            >
              Get started
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
