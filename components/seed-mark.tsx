type SeedMarkProps = {
  className?: string;
};

export function SeedMark({ className = "h-9 w-9" }: SeedMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M24 39V20"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M24 24C18 24 13.5 20.5 12 14c6-1 11.5 2 12 10Z"
        fill="currentColor"
        opacity=".9"
      />
      <path
        d="M24 29c7 0 12-4 13.5-11.5C30 16.5 24.5 21 24 29Z"
        fill="currentColor"
      />
      <path
        d="M15 39h18"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
