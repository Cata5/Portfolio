export function CLogo({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="16"
        cy="16"
        r="8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeDasharray="37 16.4"
        transform="rotate(24 16 16)"
      />
    </svg>
  );
}
