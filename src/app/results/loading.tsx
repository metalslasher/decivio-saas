export default function ResultsLoading() {
  return (
    <section className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="surface-panel h-40 animate-pulse rounded-[2rem]" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="surface-panel h-28 animate-pulse rounded-[1.7rem]" />
        <div className="surface-panel h-28 animate-pulse rounded-[1.7rem]" />
        <div className="surface-panel h-28 animate-pulse rounded-[1.7rem]" />
      </div>
      <div className="surface-panel h-96 animate-pulse rounded-[2rem]" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-panel h-80 animate-pulse rounded-[2rem]" />
        <div className="surface-panel h-80 animate-pulse rounded-[2rem]" />
      </div>
    </section>
  );
}
