export function LogoIcon({ size = 28, className = "" }: { size?: number; className?: string }) {
  const id = `shield-grad-${size}`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
      </defs>
      <path
        d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"
        fill={`url(#${id})`}
      />
    </svg>
  );
}

export function LogoFull({ iconSize = 28 }: { iconSize?: number }) {
  return (
    <span className="flex items-center gap-2 text-[20px] font-bold tracking-tight text-[#111]">
      <LogoIcon size={iconSize} />
      ShieldScore
    </span>
  );
}
