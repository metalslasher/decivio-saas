import { notFound } from "next/navigation";
import { InterviewBooking } from "@/components/hiring/interview-booking";
import { getSupabaseServiceRoleClient } from "@/lib/db/supabase";
import { getBookingView } from "@/lib/hiring/interview";
import { createMetadata } from "@/lib/seo";

type InterviewPageProps = { params: Promise<{ token: string }> };

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Запис на співбесіду",
  description: "Оберіть зручний час співбесіди.",
  path: "/interview",
  noIndex: true,
});

export default async function InterviewPage({ params }: InterviewPageProps) {
  const { token } = await params;
  const view = await getBookingView(getSupabaseServiceRoleClient(), token);
  if (!view) notFound();

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[440px] flex-col py-2">
      <InterviewBooking
        token={token}
        candidateName={view.candidateName}
        vacancyTitle={view.vacancyTitle}
        city={view.city}
        location={view.location}
        bookedSlot={view.bookedSlot}
        freeSlots={view.freeSlots}
      />
      <p className="mt-10 text-center text-[0.72rem] text-[var(--text-soft)]">
        Запис працює на <span className="font-bold">Decivio</span> — ШІ-асистенті найму
      </p>
    </div>
  );
}
