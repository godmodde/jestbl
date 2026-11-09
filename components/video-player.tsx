"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

import { Icon } from "@/components/ui";

const SPEEDS = [0.5, 0.75, 1];
const SPEED_KEY = "vidno-speed";
const SLOW_AFTER_MS = 8000;

const noSubscribe = () => () => {};
function savedSpeed() {
  try { const v = Number(localStorage.getItem(SPEED_KEY)); return SPEEDS.includes(v) ? v : 1; } catch { return 1; }
}

type Props = {
  src: string | null;
  label: string;
  autoPlay?: boolean;
  framed?: boolean;
  bleed?: boolean;
  caption?: ReactNode;
  source?: string | null;
  className?: string;
  maskCaption?: boolean;
  /** Секунда кадра-заставки: середина жеста, а не пустой первый кадр. Он же стоп-кадр при «уменьшении движения». */
  posterAt?: number;
  /** Грузить сразу, а не только метаданные — для видео первого экрана. */
  eager?: boolean;
  showProgress?: boolean;
  /** Вместо трёх скоростей одна кнопка «Медленнее» (первый экран: жест короткий, выбор из трёх лишний). */
  slowToggle?: boolean;
  /** Пропорции кадра (классы Tailwind), по умолчанию 16:9. */
  frameClass?: string;
  /** Вписывание видео в кадр (классы Tailwind): кадрирование под человека через object-cover и object-position. */
  videoClass?: string;
  /** Зациклить только отрезок ролика, секунды [начало, конец]: например, фазу, где жест показан анфас. */
  clip?: [number, number];
  /** Видеоблок первого экрана: кадр в белой рамке, под ним название, управление и пояснение. Подложку даёт родитель.
   *  Рамка — на всех размерах; с `bleed` на телефоне её нет, видео во всю ширину. */
  panel?: boolean;
  /** Пояснение под строкой управления — в панели оно часть видеоблока. */
  note?: ReactNode;
  /** Только кнопки, по центру под кадром — название и пояснение стоят рядом с видео, а не под ним. */
  centerControls?: boolean;
  /** Отрезок `clip` доигран и начинается заново — момент, когда можно сменить сцену, не оборвав жест. */
  onLoop?: () => void;
};

// Видео — самый заметный элемент урока (ТЗ, п. 17): управление рядом, поверх кадра ничего не кладём.
export function VideoPlayer({
  src, label, autoPlay = false, framed = false, bleed = false, caption, source, className = "", maskCaption = false,
  posterAt, eager = false, showProgress = true, slowToggle = false, frameClass = "aspect-video", videoClass = "object-contain", clip,
  panel = false, note, centerControls = false, onLoop,
}: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(true);
  const storedSpeed = useSyncExternalStore(noSubscribe, savedSpeed, () => 1);
  const [pickedSpeed, setPickedSpeed] = useState<number | null>(null);
  const speed = pickedSpeed ?? (slowToggle ? 1 : storedSpeed);
  const [state, setState] = useState<"loading" | "slow" | "ready" | "error">("loading");
  const [progress, setProgress] = useState(0);
  // Рядом с окном ли плеер: до этого ролик не грузится (на главной их больше десятка, а источник отвечает медленно).
  const [near, setNear] = useState(eager);
  // Пауза, поставленная рукой: уход и возврат в окно её не снимают.
  const held = useRef(false);
  // Новый ролик в том же плеере (первый экран меняет жест без пересоздания окна) — состояние загрузки заново.
  const [shownSrc, setShownSrc] = useState(src);
  if (src !== shownSrc) { setShownSrc(src); setState("loading"); setProgress(0); }

  // Видео начинает грузиться ещё до гидратации, и событие загрузки может пройти мимо — проверяем готовность при подключении.
  const attach = useCallback((el: HTMLVideoElement | null) => {
    video.current = el;
    if (el?.error) setState("error");
    else if (el && el.readyState >= 2) setState("ready");
  }, []);

  // Зависшая загрузка не даёт события ошибки — через несколько секунд честно говорим об этом и даём повторить.
  useEffect(() => {
    if (!src || state !== "loading" || !near) return;
    const timer = setTimeout(() => setState((s) => (s === "loading" ? "slow" : s)), SLOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, [src, state, near]);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    v.defaultPlaybackRate = speed;
    v.playbackRate = speed;
  }, [speed, src]);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setNear(true);
      if (!autoPlay || held.current || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (e.isIntersecting) v.play().catch(() => {}); else v.pause();
    }, { rootMargin: "400px 0px" });
    io.observe(v);
    return () => io.disconnect();
  }, [autoPlay, src]);

  const play = () => { held.current = false; return video.current?.play().catch(() => {}); };
  const toggle = () => { if (video.current?.paused) play(); else { held.current = true; video.current?.pause(); } };
  const reload = () => { setState("loading"); video.current?.load(); };
  const [rewinds, setRewinds] = useState(0);
  const restart = () => { if (video.current) video.current.currentTime = clip ? clip[0] : 0; play(); setRewinds((n) => n + 1); };
  // На подложке первого экрана кнопки белые и без рамки, на обычном фоне — тихая рамка.
  const quiet = panel ? "border-line bg-surface md:border-transparent" : "border-line";
  const pickSpeed = (s: number) => {
    setPickedSpeed(s);
    if (slowToggle) return; // переключатель первого экрана не меняет выбор, сохранённый в уроках
    try { localStorage.setItem(SPEED_KEY, String(s)); } catch {}
  };

  return (
    <figure className={`m-0 grid content-start ${panel ? "@container anim-reveal delay-1 gap-3.5 md:gap-5" : "gap-3"} ${className}`}>
      <div className={`relative ${framed ? "p-3.5 max-md:p-0" : ""} ${bleed ? "bleed-mobile" : ""}`}>
        {framed && ["tl", "tr", "bl", "br"].map((c) => <span key={c} className={`corner corner-${c} anim-focus max-md:hidden`} aria-hidden="true" />)}
        <div className={`relative ${frameClass} max-w-full overflow-hidden rounded bg-frame ${framed ? "anim-reveal delay-1" : ""} ${bleed ? "max-md:rounded-none" : ""} ${panel ? (bleed ? "md:rounded-[22px] md:shadow-[0_0_0_1px_rgba(29,28,26,0.06),0_0_0_10px_#fff,0_1px_2px_10px_rgba(29,28,26,0.05),0_40px_80px_-36px_rgba(29,28,26,0.45)]" : "rounded-[22px] shadow-[0_0_0_1px_rgba(29,28,26,0.06),0_0_0_10px_#fff,0_1px_2px_10px_rgba(29,28,26,0.05),0_40px_80px_-36px_rgba(29,28,26,0.45)]") : ""}`}>
          {src ? (
            <video
              ref={attach}
              key={src}
              src={posterAt ? `${src}#t=${posterAt}` : src}
              muted
              loop
              playsInline
              preload={eager ? "auto" : near ? "metadata" : "none"}
              aria-label={label}
              className={`absolute inset-0 h-full w-full ${videoClass}`}
              onLoadedData={() => setState("ready")}
              onPlaying={() => { setState("ready"); setPaused(false); }}
              onError={() => setState("error")}
              onPause={() => setPaused(true)}
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                if (clip && v.currentTime >= clip[1]) { v.currentTime = clip[0]; onLoop?.(); }
                if (v.duration) setProgress(v.currentTime / v.duration);
              }}
              onClick={toggle}
            />
          ) : (
            <div className="absolute inset-0 grid place-content-center justify-items-center gap-2 p-6 text-center">
              <Icon name="play" size={40} />
              <p className="m-0 font-medium">Видео появится после съёмки с носителем РЖЯ</p>
              <p className="m-0 text-sm text-ink-2">{label}</p>
            </div>
          )}
          {src && maskCaption && <CaptionMask />}
          {src && state === "loading" && near && (
            // С задержкой: быстрая загрузка проходит без мелькания надписи.
            <p className="anim-pop delay-4 absolute inset-x-0 bottom-3 m-0 text-center text-sm text-ink-2" aria-live="polite">Загружаем видео…</p>
          )}
          {src && state === "slow" && (
            <div role="status" className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 bg-frame/95 px-4 py-3 text-sm">
              <span>Видео грузится дольше обычного.</span>
              <button type="button" onClick={reload} className="press min-h-11 rounded-full border-[1.5px] border-ink px-4 font-semibold hover:bg-ink hover:text-paper">
                Загрузить ещё раз
              </button>
            </div>
          )}
          {src && state === "error" && (
            <div role="alert" className="absolute inset-0 grid place-content-center justify-items-center gap-3 bg-frame p-6 text-center">
              <p className="m-0 font-medium">Видео не загрузилось. Проверьте соединение.</p>
              <button type="button" onClick={reload} className="press min-h-11 rounded-full border-[1.5px] border-ink px-5 font-semibold hover:bg-ink hover:text-paper">
                Загрузить ещё раз
              </button>
            </div>
          )}
        </div>
      </div>

      {src && showProgress && (
        <div className={`h-1 overflow-hidden rounded-sm bg-line ${framed ? "mx-3.5 max-md:mx-0" : ""}`} aria-hidden="true">
          <span className="block h-full bg-accent" style={{ width: `${progress * 100}%` }} />
        </div>
      )}

      {/* Панель: раскладка строки — от ширины самой панели, а не окна. Широкая — название и кнопки в строку, пояснение под ними;
          узкая — название, пояснение, кнопки (как на телефоне). Порог 29.5rem: строка с включённым «Медленнее» (галочка) не переносится при нажатии. */}
      <figcaption className={centerControls ? "flex justify-center" : panel ? "grid gap-y-2.5 md:px-1 @[29.5rem]:grid-cols-[minmax(0,1fr)_auto] @[29.5rem]:items-center @[29.5rem]:gap-x-4"
        : `flex flex-wrap items-start justify-between gap-x-8 gap-y-4 ${framed ? "px-3.5 max-md:px-0" : ""}`}>
        {caption && <div className={panel ? "min-w-0" : "min-w-0 flex-[1_1_260px]"}>{caption}</div>}
        {src && (
          <div className={`flex flex-wrap items-center gap-2 max-md:w-full ${panel ? `order-2 @[29.5rem]:order-none ${note ? "@max-[29.5rem]:mt-1" : ""}` : ""}`}>
            <button type="button" aria-label={paused ? "Смотреть" : "Пауза"} onClick={toggle}
              className={`press inline-flex size-11 flex-none items-center justify-center rounded-full border hover:border-ink ${quiet}`}>
              <Icon name={paused ? "play" : "pause"} />
            </button>
            {slowToggle ? (
              <button type="button" aria-pressed={speed === 0.5} aria-label="Медленнее, 0,5×" onClick={() => pickSpeed(speed === 0.5 ? 1 : 0.5)}
                className={`press inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium whitespace-nowrap tabular-nums hover:border-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper ${quiet}`}>
                {speed === 0.5 && <span className="anim-pop"><Icon name="check" size={16} /></span>}
                {/* В узком кадре (компактный коллаж на телефоне) — только «0,5×», полное название остаётся в aria-label. */}
                <span className="@max-[17rem]:hidden">Медленнее ·</span> 0,5×
              </button>
            ) : (
              <div role="group" aria-label="Скорость видео" className="inline-flex rounded-full bg-track p-[3px] text-sm font-semibold tabular-nums max-md:flex-1">
                {SPEEDS.map((s) => (
                  <button key={s} type="button" aria-pressed={speed === s} onClick={() => pickSpeed(s)}
                    className="press min-h-11 min-w-13 rounded-full px-3 aria-pressed:bg-surface aria-pressed:ring-[1.5px] aria-pressed:ring-ink aria-pressed:ring-inset max-md:min-w-0 max-md:flex-1">
                    {String(s).replace(".", ",")}×
                  </button>
                ))}
              </div>
            )}
            {/* В панели и рядом с «Медленнее» — только значок: строка управления помещается под узким портретным кадром. */}
            <button type="button" aria-label="Повторить с начала" title="С начала"
              onClick={restart}
              className={`press inline-flex min-h-11 flex-none items-center gap-2 rounded-full border text-sm font-medium hover:border-ink ${quiet} ${panel || slowToggle ? "w-11 justify-center" : "px-4 max-sm:w-11 max-sm:justify-center max-sm:px-0"}`}>
              {/* Значок делает оборот назад — нажатие замечено, ролик пошёл с начала. */}
              <span key={rewinds} className={`grid ${rewinds ? "anim-rewind" : ""}`}><Icon name="replay" /></span>
              <span className={panel || slowToggle ? "hidden" : "max-sm:hidden"}>С начала</span>
            </button>
          </div>
        )}
        {note && <div className={panel ? "order-1 @[29.5rem]:order-none @[29.5rem]:col-span-2" : "w-full"}>{note}</div>}
        {source && (
          <p className="m-0 w-full text-[13px] text-muted">
            Видео: <a href={source} target="_blank" rel="noopener" className="underline underline-offset-2">surdo.media</a> · демо для локального показа
          </p>
        )}
      </figcaption>
    </figure>
  );
}

// ponytail: в демо-видео surdo.media слово вшито в левый верхний угол и в заданиях выдаёт ответ — размываем угол.
// Убрать, когда появятся собственные видео без подписей.
// Высота с запасом: у части роликов под словом вторая строка («Вариант 1»). Края растушёваны маской, без подкраски —
// размытие растворяется в фоне ролика, а не лежит прямоугольником. Для обрезанного кадра размер задаёт вызывающий.
export function CaptionMask({ className = "h-[38%] w-[64%]" }: { className?: string }) {
  return <div aria-hidden="true" className={`pointer-events-none absolute top-0 left-0 backdrop-blur-xl [mask-composite:intersect] [mask-image:linear-gradient(to_right,#000_70%,transparent),linear-gradient(to_bottom,#000_70%,transparent)] ${className}`} />;
}
