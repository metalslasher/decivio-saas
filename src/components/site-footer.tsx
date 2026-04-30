"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WordmarkLogo } from "@/components/wordmark-logo";

type SocialLink = {
  href: string;
  label: string;
  icon: JSX.Element;
};

const legalLinks = [
  { href: "/terms", label: "Умови використання" },
  { href: "/privacy", label: "Політика конфіденційності" }
];

const socialLinks: SocialLink[] = [
  {
    href: "https://www.instagram.com/decivio",
    label: "Instagram",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm0 2A3.8 3.8 0 0 0 4 7.8v8.4A3.8 3.8 0 0 0 7.8 20h8.4a3.8 3.8 0 0 0 3.8-3.8V7.8A3.8 3.8 0 0 0 16.2 4H7.8ZM12 7.2A4.8 4.8 0 1 1 12 16.8 4.8 4.8 0 0 1 12 7.2Zm0 2A2.8 2.8 0 1 0 12 14.8 2.8 2.8 0 0 0 12 9.2Zm5.05-2.45a1.15 1.15 0 1 1-2.3 0 1.15 1.15 0 0 1 2.3 0Z"
        />
      </svg>
    )
  },
  {
    href: "https://www.linkedin.com/company/decivio",
    label: "LinkedIn",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          fill="currentColor"
          d="M6.5 8.8H3.2V21h3.3V8.8Zm-1.7-5A1.9 1.9 0 0 0 3 5.7a1.9 1.9 0 0 0 1.9 1.9 1.9 1.9 0 0 0 0-3.8ZM21 14.4c0-3.7-2-5.4-4.7-5.4-2.2 0-3.1 1.2-3.7 2V8.8H9.4V21h3.3v-6.8c0-1.8.3-3.5 2.6-3.5 2.2 0 2.3 2 2.3 3.6V21H21v-6.6Z"
        />
      </svg>
    )
  },
  {
    href: "https://www.facebook.com/decivio",
    label: "Facebook",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          fill="currentColor"
          d="M14.3 21v-7.6h2.6l.4-3h-3V8.5c0-.9.2-1.5 1.5-1.5h1.7V4.3c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2H8.1v3h2.8V21h3.4Z"
        />
      </svg>
    )
  },
  {
    href: "https://www.youtube.com/@decivio",
    label: "YouTube",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          fill="currentColor"
          d="M21.6 8.2c-.2-.9-.9-1.6-1.8-1.8C18.2 6 12 6 12 6s-6.2 0-7.8.4c-.9.2-1.6.9-1.8 1.8C2 9.8 2 12 2 12s0 2.2.4 3.8c.2.9.9 1.6 1.8 1.8 1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.6.4-3.8.4-3.8s0-2.2-.4-3.8Zm-12 6.1V9.7l4 2.3-4 2.3Z"
        />
      </svg>
    )
  }
];

export function SiteFooter() {
  const pathname = usePathname();
  const year = new Date().getFullYear();

  if (pathname?.startsWith("/dashboard")) {
    return null;
  }

  return (
    <footer className="mt-16 bg-[linear-gradient(180deg,#162235_0%,#0f1726_100%)] text-white md:mt-24">
      <div className="mx-auto w-full max-w-[1480px] px-[clamp(18px,3.6vw,56px)] py-12 md:px-[clamp(26px,4vw,68px)] md:py-16">
        <div className="grid gap-10 border-b border-white/18 pb-10 md:pb-12 lg:grid-cols-[1.2fr_auto] lg:items-start">
          <div className="space-y-5">
            <WordmarkLogo tone="light" className="text-[2.6rem] md:text-[3rem]" />
            <p className="max-w-xl text-[0.98rem] font-medium leading-[1.65] text-white/78 md:text-[1.08rem]">
              Отримайте професійну підтримку для карʼєрного переходу: оцініть свій шлях, посильте резюме й рухайтесь до роботи,
              яку справді хочете.
            </p>
          </div>

          <div className="lg:justify-self-end">
            <div className="flex gap-3 lg:justify-end">
              {socialLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  className="inline-flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-white text-[#182845] transition hover:-translate-y-px hover:bg-white/92"
                >
                  {item.icon}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-6 text-sm text-white/86 md:flex-row md:items-center md:justify-between">
          <p>© {year} Decivio. Усі права захищено.</p>

          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {legalLinks.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-white/70">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
