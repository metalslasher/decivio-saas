type BrandBadgeProps = {
  size?: "default" | "sidebar";
};

const sizeClasses = {
  default: {
    shell: "h-10 w-10 rounded-[1rem]",
    icon: "h-5 w-5"
  },
  sidebar: {
    shell: "h-14 w-14 rounded-[1.5rem]",
    icon: "h-7 w-7"
  }
} as const;

function BrandMarkIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path
        d="M23 16.5h9.8c10.2 0 16.7 6.2 16.7 15.5s-6.5 15.5-16.7 15.5H23v-31Zm9.2 24c5.9 0 9.7-3.3 9.7-8.5s-3.8-8.5-9.7-8.5H30v17h2.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function BrandBadge({ size = "default" }: BrandBadgeProps) {
  const classes = sizeClasses[size];

  return (
    <span
      className={`inline-flex items-center justify-center bg-[linear-gradient(180deg,#5b72ff_0%,#4563ff_100%)] text-white shadow-[0_16px_28px_-18px_rgba(67,97,255,0.42)] ${classes.shell}`}
    >
      <BrandMarkIcon className={classes.icon} />
    </span>
  );
}
