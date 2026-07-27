export function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      className="brand-mark"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
    >
      <rect width="32" height="32" rx="8" fill="#26324A" />
      <path
        d="M8.75 7.75h14.5v3.75H12.75v3.75h8v3.75h-8v6.25h-4V7.75Z"
        fill="white"
      />
      <rect x="22" y="18.75" width="2.5" height="6.5" rx="1.25" fill="#C9F07B" />
    </svg>
  );
}
