"use client";

import { useState } from "react";

interface PricingButtonProps {
  plan: string;
  variant: "filled" | "outline";
  children: React.ReactNode;
}

export default function PricingButton({ plan, variant, children }: PricingButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Something went wrong. Please try again.");
        setLoading(false);
      }
    } catch {
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const base =
    "flex w-full cursor-pointer items-center justify-center rounded-[10px] py-3.5 text-[15px] font-semibold transition-colors disabled:opacity-60";

  const styles =
    variant === "filled"
      ? `${base} bg-[#111111] text-white hover:bg-[#333]`
      : `${base} border-[1.5px] border-[#e5e7eb] bg-white text-[#111111] hover:bg-[#f9fafb]`;

  return (
    <button onClick={handleClick} disabled={loading} className={styles}>
      {loading ? "Redirecting..." : children}
    </button>
  );
}
