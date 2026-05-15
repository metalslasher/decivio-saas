import Image from "next/image";
import { Reveal } from "@/components/reveal";
import { careerHelpStages } from "./home-data";

export function CareerHelpSection() {
  return (
    <section className="relative mx-auto mt-12 max-w-[80rem] md:mt-16" aria-labelledby="career-help-title">
      <Reveal>
        <div className="relative min-w-0 overflow-hidden rounded-[2.2rem] bg-[linear-gradient(135deg,#fbfcff_0%,#f2f5ff_52%,#eef3ff_100%)] px-5 pb-7 pt-8 shadow-[0_28px_80px_rgba(35,48,78,0.1)] md:px-8 md:pb-9 md:pt-10 lg:min-h-[38rem] lg:px-11">
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.86)_0%,rgba(255,255,255,0.35)_48%,rgba(67,97,255,0.08)_100%)]"
            aria-hidden="true"
          />

          <div className="relative z-20 max-w-[33rem] text-center sm:text-left">
            <h2 id="career-help-title" className="home-section-heading max-w-full break-words [overflow-wrap:anywhere]">
              Шлях до <span className="home-section-heading-accent">кращої пропозиції</span>
            </h2>
            <p className="mt-5 max-w-[29rem] text-[0.98rem] font-medium leading-[1.72] text-[var(--text-muted)] md:text-[1.06rem]">
              Перетворюємо вашу реальну ситуацію на зрозумілий план дій.
            </p>
          </div>

          <Image
            src="/graphics/career-path-flag.png"
            alt=""
            width={1774}
            height={887}
            sizes="(max-width: 1279px) 100vw, 74rem"
            className="pointer-events-none absolute right-[-6rem] top-4 z-10 hidden w-[70rem] max-w-none select-none lg:block xl:right-[-4rem] xl:w-[74rem]"
            aria-hidden="true"
            priority
          />

          <div className="relative z-20 mt-9 grid min-w-0 gap-4 md:mt-16 md:grid-cols-3 lg:mt-[17rem]">
            {careerHelpStages.map((stage) => (
              <article
                key={stage.title}
                className="relative min-w-0 rounded-[1.65rem] border border-white/78 bg-white/90 px-5 pb-6 pt-8 shadow-[0_22px_48px_rgba(35,48,78,0.1)] backdrop-blur-md md:min-h-[10.5rem] md:px-6 md:pt-9"
              >
                <span className="absolute -left-2 -top-4 flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(67,97,255,0.12)] font-display text-[0.86rem] font-extrabold text-[var(--accent-strong)] shadow-[0_12px_24px_rgba(67,97,255,0.2)]">
                  {stage.step}
                </span>

                <h3 className="break-words font-display text-[1.22rem] font-bold leading-[1.14] tracking-normal text-[var(--text-strong)] [overflow-wrap:anywhere] md:text-[1.32rem]">
                  {stage.title}
                </h3>
                <p className="mt-3 text-[0.9rem] leading-[1.58] text-[var(--text-muted)] md:text-[0.94rem]">{stage.description}</p>
              </article>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
