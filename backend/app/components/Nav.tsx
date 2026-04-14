"use client";

import { useState, useEffect, useCallback } from "react";
import { LogoFull } from "./Logo";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  const links = [
    { href: "/#how-it-works", label: "How it works" },
    { href: "/#features", label: "Monitoring" },
    { href: "/pricing", label: "Pricing" },
    { href: "/blog", label: "Blog" },
  ];

  const ease = "cubic-bezier(0.22, 1, 0.36, 1)";

  return (
    <>
      <nav
        className="fixed top-0 right-0 left-0 z-50 backdrop-blur-xl"
        style={{
          backgroundColor: scrolled ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.9)",
          boxShadow: scrolled ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
          transition: `background-color 0.5s ${ease}, box-shadow 0.5s ${ease}`,
        }}
      >
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-4">
          <a href="/" className="no-underline">
            <LogoFull />
          </a>

          {/* Desktop links */}
          <div className="hidden items-center gap-6 md:flex">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-[14px] font-medium text-[#666] no-underline transition-colors duration-200 hover:text-[#111]"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Desktop CTA */}
            <a
              href="https://marketplace.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-hover hidden items-center rounded-lg bg-[#111] px-5 py-2.5 text-[14px] font-semibold text-white no-underline md:inline-flex"
            >
              Install from Stripe
            </a>

            {/* Hamburger / X button — mobile only */}
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              className="relative z-50 flex h-10 w-10 items-center justify-center rounded-lg md:hidden"
              style={{
                transition: `background-color 0.4s ${ease}`,
              }}
            >
              <div className="relative h-6 w-6">
                {/* Hamburger */}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#111"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="absolute inset-0 h-6 w-6"
                  style={{
                    opacity: open ? 0 : 1,
                    transform: open ? "rotate(-180deg) scale(0.6)" : "rotate(0deg) scale(1)",
                    transition: `opacity 0.7s ${ease}, transform 0.7s ${ease}`,
                  }}
                >
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </svg>
                {/* X */}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#111"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="absolute inset-0 h-6 w-6"
                  style={{
                    opacity: open ? 1 : 0,
                    transform: open ? "rotate(0deg) scale(1)" : "rotate(180deg) scale(0.6)",
                    transition: `opacity 0.7s ${ease}, transform 0.7s ${ease}`,
                  }}
                >
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      <div
        onClick={close}
        className="fixed inset-0 z-40 md:hidden"
        style={{
          backgroundColor: open ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0)",
          backdropFilter: open ? "blur(4px)" : "blur(0px)",
          WebkitBackdropFilter: open ? "blur(4px)" : "blur(0px)",
          pointerEvents: open ? "auto" : "none",
          transition: `background-color 0.8s ${ease}, backdrop-filter 0.8s ${ease}, -webkit-backdrop-filter 0.8s ${ease}`,
        }}
      />

      {/* Mobile drawer */}
      <div
        className="fixed top-0 right-0 left-0 z-40 md:hidden"
        style={{
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0)" : "translateY(-100%)",
          transition: `transform 0.85s ${ease}, opacity 0.6s ${ease}`,
          pointerEvents: open ? "auto" : "none",
        }}
      >
        <div className="bg-white pt-[76px] pb-8 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
          <div className="mx-auto max-w-[1100px] px-6">
            <div className="flex flex-col gap-0.5">
              {links.map((l, i) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={close}
                  className="rounded-xl px-4 py-3.5 text-[16px] font-medium text-[#333] no-underline"
                  style={{
                    opacity: open ? 1 : 0,
                    transform: open ? "translateY(0) scale(1)" : "translateY(-12px) scale(0.97)",
                    transition: `opacity 0.6s ${ease} ${250 + i * 100}ms, transform 0.6s ${ease} ${250 + i * 100}ms, background-color 0.3s ${ease}`,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  {l.label}
                </a>
              ))}
            </div>

            <div
              className="mt-5 border-t border-[#eee] pt-5"
              style={{
                opacity: open ? 1 : 0,
                transform: open ? "translateY(0) scale(1)" : "translateY(-12px) scale(0.97)",
                transition: `opacity 0.6s ${ease} ${250 + links.length * 100}ms, transform 0.6s ${ease} ${250 + links.length * 100}ms`,
              }}
            >
              <a
                href="https://marketplace.stripe.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={close}
                className="btn-hover flex w-full items-center justify-center rounded-xl bg-[#111] px-5 py-3.5 text-[15px] font-semibold text-white no-underline"
              >
                Install from Stripe
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
