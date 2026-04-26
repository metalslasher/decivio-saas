import { BrandMark } from "@/components/brand-mark";

type BrandBadgeProps = {
  size?: "default" | "sidebar";
};

const sizeClasses = {
  default: {
    shell: "h-10 w-10 rounded-[0.95rem]",
    icon: "h-8 w-8"
  },
  sidebar: {
    shell: "h-14 w-14 rounded-[1.25rem]",
    icon: "h-11 w-11"
  }
} as const;

export function BrandBadge({ size = "default" }: BrandBadgeProps) {
  const classes = sizeClasses[size];

  return (
    <span
      className={`inline-flex items-center justify-center border border-[rgba(24,26,32,0.08)] bg-white shadow-[0_18px_34px_-24px_rgba(22,29,43,0.38)] ${classes.shell}`}
    >
      <BrandMark className={classes.icon} />
    </span>
  );
}
