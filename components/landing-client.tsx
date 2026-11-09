"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ExerciseRecognize } from "@/components/exercises";
import { SignTiles } from "@/components/sign-card";
import { VideoPlayer } from "@/components/video-player";
import type { Sign } from "@/lib/data";
import { useSlideMark } from "@/lib/use-slide-mark";

const STAGES = [
  { n: "01", title: "Смотрим", text: "Пауза, замедление до 0,5×, повтор" },
  { n: "02", title: "Разбираем", text: "Что значит и как выполняется" },
  { n: "03", title: "Пробуем", text: "Узнайте жест в задании" },
];

type Option = { slug: string; title: string };

// Этапы показываем настоящими компонентами платформы: рисованные кнопки, которые не нажимаются, запрещены (ТЗ, п. 10, 31).
function StageVisual({ stage, sign, options, clip, onLoop }: { stage: number; sign: Sign; options: Option[]; clip?: [number, number]; onLoop?: () => void }) {
  const router = useRouter();
  if (stage === 0) {
    // «Смотрим» — кадр 16:9 целиком (просьба заказчика 2026-10-10). Вшитое в демо-ролик слово размыто, как в заданиях.
    // По кругу — один вариант жеста (`clip`): в демо-ролике их три подряд, с поворотами — без отрезка видео «обрывистое».
    return <VideoPlayer src={sign.videoUrl} label={`Жест «${sign.title}»`} autoPlay showProgress={false} source={sign.sourceUrl} maskCaption clip={clip} onLoop={onLoop} className="w-full" />;
  }
  if (stage === 1) return <div className="w-full"><SignTiles sign={sign} /></div>;
  return (
    <ExerciseRecognize stacked portrait clip={clip} videoUrl={sign.videoUrl} answer={sign.slug} options={options}
      nextLabel="Пройти первый урок" onDone={() => router.push("/learn/zdorovaemsya")} />
  );
}

/** «Сначала посмотрим, потом попробуем» — вкладки (выбор заказчика 2026-10-10 из трёх вариантов): один экран,
 *  страницу не растягивает. Шаги слева, сцена справа. */
export function HowItWorks({ sign, options, clip }: { sign: Sign; options: Option[]; clip?: [number, number] }) {
  return <HowTabs sign={sign} options={options} clip={clip} />;
}

const stepNumber = "font-display text-sm font-semibold tracking-[0.08em] text-accent tabular-nums";

/** Вкладки: шаги слева, сцена справа. Пока блок на экране, шаги сменяются сами (7 с, полоска показывает время);
 *  наведение и фокус ставят на паузу, выбор шага рукой выключает автопереключение. Без анимаций — не листаются сами. */
function HowTabs({ sign, options, clip }: { sign: Sign; options: Option[]; clip?: [number, number] }) {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  // «Смотрим» переключается дальше только на стыке повтора: жест не обрывается на середине движения.
  const [waitLoop, setWaitLoop] = useState(false);
  const next = () => { setWaitLoop(false); setActive((a) => (a + 1) % STAGES.length); };
  const [inView, setInView] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.45 });
    if (root.current) io.observe(root.current);
    return () => io.disconnect();
  }, []);
  const pick = (i: number) => { setActive(i); setAuto(false); };
  const list = useRef<HTMLDivElement>(null);
  const mark = useSlideMark<HTMLSpanElement>(list, "[aria-selected=true]", active);
  return (
    <div ref={root} className="how-tabs grid gap-8 md:gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:items-center lg:gap-16">
      {/* Шаги и пояснение к выбранному (на телефоне) — одна группа: пояснение ближе к шагам, чем к сцене. */}
      <div className="grid gap-3">
      <div ref={list} role="tablist" aria-label="Этапы урока" className="relative grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-3">
        {/* Светлая плашка переезжает к выбранному шагу — видно, откуда и куда перешли. */}
        <span ref={mark} aria-hidden="true" className="slide-mark rounded-[22px] bg-surface opacity-0 shadow-[0_18px_40px_-28px_rgba(29,28,26,0.35)]" />
        {STAGES.map((s, i) => (
          <button key={s.n} type="button" role="tab" id={`how-tab-${i}`} aria-selected={active === i} aria-controls="how-panel" onClick={() => pick(i)}
            className="group relative grid content-start gap-1.5 overflow-hidden rounded-[22px] p-3 text-left transition-colors hover:bg-surface/50 aria-selected:hover:bg-transparent sm:p-4 lg:gap-3 lg:p-7">
            {/* На телефоне три шага в ряд: номер над названием, чтобы «Разбираем» помещался целиком. */}
            <span className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-2.5">
              <span className={stepNumber}>{s.n}</span>
              <span className="font-display text-base leading-none font-semibold tracking-[-0.02em] sm:text-2xl lg:text-[clamp(28px,2.4vw,40px)]">{s.title}</span>
            </span>
            <span className={`text-ink-2 transition-opacity duration-300 max-lg:hidden ${active === i ? "" : "opacity-60 group-hover:opacity-85"}`}>{s.text}</span>
            {active === i && auto && inView && (
              <span aria-hidden="true" className="how-timer absolute inset-x-0 bottom-0 h-1 origin-left bg-accent"
                onAnimationEnd={() => (active === 0 && clip ? setWaitLoop(true) : next())} />
            )}
          </button>
        ))}
      </div>
      <p key={active} className="anim-focus-in m-0 text-ink-2 lg:hidden">{STAGES[active].text}</p>
      </div>
      <div id="how-panel" role="tabpanel" aria-labelledby={`how-tab-${active}`}
        className="grid min-h-[min(600px,78svh)] place-items-center rounded-[28px] bg-surface/50 p-6 max-lg:min-h-0 md:p-8 xl:p-9">
        <div key={active} className="anim-focus-in grid w-full place-items-center">
          <StageVisual stage={active} sign={sign} options={options} clip={clip} onLoop={() => { if (waitLoop && auto) next(); }} />
        </div>
      </div>
    </div>
  );
}
