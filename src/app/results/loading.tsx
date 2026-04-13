export default function ResultsLoading() {
  return (
    <section className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="h-32 animate-pulse rounded-[2rem] bg-[rgba(255,255,255,0.62)]" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="surface-panel h-28 animate-pulse rounded-[1.7rem]" />
        <div className="surface-panel h-28 animate-pulse rounded-[1.7rem]" />
        <div className="surface-panel h-28 animate-pulse rounded-[1.7rem]" />
        <div className="surface-panel h-28 animate-pulse rounded-[1.7rem]" />
        <div className="surface-panel h-28 animate-pulse rounded-[1.7rem]" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-panel h-80 animate-pulse rounded-[2rem]" />
        <div className="surface-panel h-80 animate-pulse rounded-[2rem]" />
      </div>
      <div className="surface-panel h-72 animate-pulse rounded-[2rem]" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-panel h-72 animate-pulse rounded-[2rem]" />
        <div className="surface-panel h-72 animate-pulse rounded-[2rem]" />
      </div>
      <div className="surface-panel h-52 animate-pulse rounded-[2rem]" />
    </section>
  );
}
