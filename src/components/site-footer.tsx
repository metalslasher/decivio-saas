"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WordmarkLogo } from "@/components/wordmark-logo";

type SocialLink = {
  href: string;
  label: string;
  icon: JSX.Element;
};

const footerNav = [
  { href: "/simulate", label: "Симуляція" },
  { href: "/pricing", label: "Ціни" },
  { href: "/#features", label: "Можливості" },
  { href: "/#reviews", label: "Відгуки" },
  { href: "/#faq", label: "FAQ" }
];

const socialLinks: SocialLink[] = [
  {
    href: "https://t.me/decivio",
    label: "Telegram",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          fill="currentColor"
          d="M21.2 4.4c.3-.1.6.1.7.4.1.2.1.3.1.5l-3.1 14.3c-.1.5-.6.8-1 .7-.1 0-.2-.1-.3-.2l-4-3-2 2c-.2.3-.5.4-.8.4-.5 0-.9-.4-.9-.9l.5-4.5 8.3-7.5c.2-.2.2-.5 0-.7-.1-.1-.3-.1-.5 0l-10 6.3-4.1-1.3c-.5-.2-.7-.7-.5-1.1.1-.2.3-.4.5-.5l16.1-5.9Z"
        />
      </svg>
    )
  },
  {
    href: "https://www.linkedin.com/company/decivio",
    label: "LinkedIn",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          fill="currentColor"
          d="M6.5 8.8H3.2V21h3.3V8.8Zm-1.7-5A1.9 1.9 0 0 0 3 5.7a1.9 1.9 0 0 0 1.9 1.9 1.9 1.9 0 0 0 0-3.8ZM21 14.4c0-3.7-2-5.4-4.7-5.4-2.2 0-3.1 1.2-3.7 2V8.8H9.4V21h3.3v-6.8c0-1.8.3-3.5 2.6-3.5 2.2 0 2.3 2 2.3 3.6V21H21v-6.6Z"
        />
      </svg>
    )
  },
  {
    href: "https://www.youtube.com/@decivio",
    label: "YouTube",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
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
    <footer className="mt-24 bg-[var(--surface-ink)] text-white">
      <div className="mx-auto w-full max-w-[1480px] px-[clamp(18px,3.6vw,56px)] py-12 md:px-[clamp(26px,4vw,68px)] md:py-16">
        <div className="grid gap-10 border-b border-white/10 pb-10 lg:grid-cols-[1.2fr_1fr_auto]">
          <div className="space-y-4">
            <WordmarkLogo tone="light" className="text-[2.25rem]" />
            <p className="max-w-md text-sm leading-relaxed text-white/64">Змінюйте карʼєру з планом, а не навмання.</p>
          </div>

          <nav className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm text-white/68 lg:content-start" aria-label="Навігація футера">
            {footerNav.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="space-y-3 lg:justify-self-end">
            <p className="text-sm font-semibold text-white">Ми в соцмережах</p>
            <div className="flex gap-2">
              {socialLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={item.label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/6 text-white/72 transition hover:border-[rgba(63,94,255,0.28)] hover:bg-white/10 hover:text-white"
                >
                  {item.icon}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-5 text-center text-xs text-white/48">© {year} Decivio. Всі права захищено.</div>
      </div>
    </footer>
  );
}
