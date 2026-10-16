import { notFound } from "next/navigation";
import { ApplyFlow } from "@/components/hiring/apply-flow";
import { getSupabaseServiceRoleClient } from "@/lib/db/supabase";
import { getVacancyBySlug, toPublicVacancy } from "@/lib/hiring/store";
import { createMetadata } from "@/lib/seo";

type ApplyPageProps = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

async function loadVacancy(slug: string) {
  if (!/^[a-z0-9]{6,16}$/.test(slug)) {
    return null;
  }

  const vacancy = await getVacancyBySlug(getSupabaseServiceRoleClient(), slug);
  return vacancy ? toPublicVacancy(vacancy) : null;
}

export async function generateMetadata({ params }: ApplyPageProps) {
  const { slug } = await params;
  const vacancy = await loadVacancy(slug);

  return createMetadata({
    title: vacancy ? `${vacancy.title}${vacancy.city ? ` — ${vacancy.city}` : ""}` : "Вакансія",
    description: vacancy ? `${vacancy.pay_hint}. ${vacancy.summary}` : "Відгукніться на вакансію за 2 хвилини.",
    path: `/apply/${slug}`,
    noIndex: true,
  });
}

export default async function ApplyPage({ params }: ApplyPageProps) {
  const { slug } = await params;
  const vacancy = await loadVacancy(slug);

  if (!vacancy) {
    notFound();
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[440px] flex-col py-2">
      <ApplyFlow vacancy={vacancy} />
      <p className="mt-10 text-center text-[0.72rem] text-[var(--text-soft)]">
        Анкета працює на <span className="font-bold">Decivio</span> — ШІ-асистенті найму
      </p>
    </div>
  );
}
