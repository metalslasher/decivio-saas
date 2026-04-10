import Link from "next/link";

export default function NotFound() {
  return (
    <section className="surface-panel space-y-5 rounded-[2.2rem] p-6 md:p-8">
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
