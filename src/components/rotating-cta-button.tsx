"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type RotatingCtaButtonProps = {
  href: string;
  labels: readonly string[];
  className?: string;
};

export function RotatingCtaButton({ href, labels, className = "" }: RotatingCtaButtonProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (labels.length <= 1) return;

    const intervalId = setInterval(() => {
      setIndex((prev) => (prev + 1) % labels.length);
    }, 2800);

    return () => clearInterval(intervalId);
  }, [labels]);

  if (labels.length === 0) return null;

  return (
    <Link href={href} className={className}>
      <span>{labels[index]}</span>
    </Link>
  );
}

