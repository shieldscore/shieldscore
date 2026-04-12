"use client";

import { useState } from "react";

interface FaqItem {
  q: string;
  a: string;
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="flex flex-col">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.q} className="border-b border-[#f0f0f0]">
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full cursor-pointer items-center justify-between py-5 text-left"
            >
              <span className="pr-4 text-[16px] font-semibold text-[#111111]">
                {item.q}
              </span>
              <svg
                className={`h-5 w-5 shrink-0 text-[#999999] transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <div
              className={`overflow-hidden transition-all duration-200 ${isOpen ? "max-h-[500px] pb-5" : "max-h-0"}`}
            >
              <p className="text-[14px] leading-[1.8] text-[#777777]">{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
