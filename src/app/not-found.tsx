import Link from "next/link";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Сторінку не знайдено",
  description: "404 сторінка Decivio.",
  path: "/404",
  noIndex: true
});

export default function NotFound() {
  return (
    <section className="surface-panel mx-auto max-w-3xl space-y-5 rounded-[2rem] p-6 md:p-8">
      <span className="eyebrow-pill">404</span>
      <h1 className="page-title max-w-[10ch]">Сторінку не знайдено</h1>
      <p className="lead-copy max-w-2xl">
        Можливо, посилання застаріло або сторінку вже переміщено. Поверніться на головну і запустіть нову симуляцію переходу.
      </p>
      <Link href="/" className="btn-primary">
        Повернутися на головну
      </Link>
    </section>
  );
}
