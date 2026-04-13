"use client";

interface PricingButtonProps {
  variant: "filled" | "outline";
  disabled?: boolean;
  children: React.ReactNode;
}

export default function PricingButton({ variant, disabled, children }: PricingButtonProps) {
  function handleClick() {
    alert("Coming soon to the Stripe App Marketplace. Join the waitlist at shieldscore.com to be notified when we launch.");
  }

  const base =
    "flex w-full cursor-pointer items-center justify-center rounded-[10px] py-3.5 text-[15px] font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

  const styles =
    variant === "filled"
      ? `${base} bg-[#111111] text-white hover:bg-[#333]`
      : `${base} border-[1.5px] border-[#e5e7eb] bg-white text-[#111111] hover:bg-[#f9fafb]`;

  return (
    <button onClick={handleClick} disabled={disabled} className={styles}>
      {children}
    </button>
  );
}
