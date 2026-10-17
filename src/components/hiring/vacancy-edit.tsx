"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useEmployerSession } from "@/components/hiring/use-employer-session";
import { VacancyEditor } from "@/components/hiring/vacancy-builder";
import { apiRequest } from "@/lib/hiring/client";
import type { VacancyContent, VacancyDetail } from "@/lib/hiring/types";

export function VacancyEdit({ vacancyId }: { vacancyId: string }) {
  const router = useRouter();
  const session = useEmployerSession();
  const [vacancy, setVacancy] = useState<VacancyDetail | null>(null);
  const [content, setContent] = useState<VacancyContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (session.status !== "user") return;
    apiRequest<{ vacancy: VacancyDetail }>(`/api/hiring/vacancies/${vacancyId}`, { auth: true })
      .then((result) => {
        setVacancy(result.vacancy);
        setContent(result.vacancy.content);
      })
      .catch((loadError: Error) => setError(loadError.message));
  }, [session.status, vacancyId]);

  const save = async () => {
    if (!content) return;
    setIsSaving(true);
    setError(null);
    try {
      await apiRequest(`/api/hiring/vacancies/${vacancyId}`, { auth: true, method: "PATCH", body: { content } });
      router.push(`/hire/${vacancyId}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Не вдалося зберегти вакансію.");
      setIsSaving(false);
    }
  };

  if (session.status === "guest") {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <p className="body-copy">Увійдіть, щоб редагувати вакансію.</p>
        <Link href="/hire" className="btn-primary mt-4">
          До входу
        </Link>
      </div>
    );
  }

  if (!vacancy || !content) {
    return error ? (
      <p className="card mx-auto max-w-lg p-8 text-center font-semibold text-[var(--bad)]">{error}</p>
    ) : (
      <div className="space-y-4">
        <div className="shimmer h-10 w-64" />
        <div className="shimmer h-64 w-full" />
      </div>
    );
  }

  return (
    <VacancyEditor
      mode="edit"
      content={content}
      city={vacancy.city ?? ""}
      onChange={setContent}
      onRestart={() => router.push(`/hire/${vacancyId}`)}
      onPublish={save}
      isPublishing={isSaving}
      error={error}
      isLimitReached={false}
    />
  );
}
