import QRCode from "qrcode";

/** Static poster preview for the landing page (server component, real scannable QR to the builder). */
export async function PosterDemo() {
  const qr = await QRCode.toString("https://www.decivio.net/hire/new", {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#121726", light: "#ffffff" },
  });

  return (
    <div className="relative mx-auto w-full max-w-[360px]" aria-hidden="true">
      <div className="absolute -left-6 top-10 h-24 w-24 rotate-[-12deg] rounded-2xl bg-[#ffe7a8] shadow-lg" />
      <div className="float-slow relative rotate-[2deg] overflow-hidden rounded-[1.4rem] bg-white shadow-[0_40px_80px_-40px_rgba(18,23,38,0.5)]">
        <div className="bg-[linear-gradient(135deg,#4361ff,#2c3fd6)] px-6 py-6 text-white">
          <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-white/70">Ми шукаємо</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight">Бариста</p>
          <p className="mt-1 text-sm text-white/80">📍 Поділ</p>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-4 p-6">
          <div className="space-y-2 text-sm">
            <p className="font-extrabold">24 000 – 30 000 грн</p>
            <p className="text-[var(--text-muted)]">Графік 2/2</p>
            <p>✓ Навчання</p>
            <p>✓ Чайові щодня</p>
          </div>
          <div className="text-center">
            <div className="h-24 w-24 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
            <p className="mt-2 text-[0.6rem] font-bold leading-tight">Відгук за 2 хв</p>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-4 right-2 rotate-[-4deg] rounded-full bg-white px-3 py-1.5 text-xs font-extrabold shadow-lg">📌 На вітрину чи біля каси</div>
    </div>
  );
}
