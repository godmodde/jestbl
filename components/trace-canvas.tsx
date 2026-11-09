"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type PointerEvent } from "react";

import { btn, Icon } from "@/components/ui";
import { LETTERS, strokeMarks } from "@/lib/letters";
import { checkStroke, type TraceReason } from "@/lib/trace";

// Обведение печатной буквы пальцем, мышью или пером (раздел «Алфавит»). Проверка черты — lib/trace.ts.
// Ошибка — не красным: след гаснет, под полем короткая подсказка, что поправить.

type Point = { x: number; y: number };
type Props = { letter: string; onDone: () => void; onSkip?: () => void;
  /** Без кнопок «Показать» и «Очистить» — для живого примера на главной. */
  compact?: boolean };

const HINTS: Record<TraceReason, (n: number) => string> = {
  short: (n) => `Начните с точки ${n} и доведите до конца`,
  "wrong-direction": () => "Ведите в сторону стрелки",
  "off-path": () => "Держитесь ближе к линии",
};

const REDUCED = "(prefers-reduced-motion: reduce)";
function subscribe(cb: () => void) {
  const m = matchMedia(REDUCED);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}

const polyline = (pts: Point[]) => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

// Вне компонента — стабильная ссылка: React вызовет её один раз на новый след.
function fadeOut(el: SVGPolylineElement | null) {
  el?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700, easing: "ease-out", fill: "forwards" });
}

/** Поле обведения буквы. Ширину задаёт родитель. onDone — один раз, когда пройдены все черты. */
export function TraceCanvas(props: Props) {
  // Новая буква — чистое поле: состояние сбрасывает ключ.
  return <Trace key={props.letter} {...props} />;
}

function Trace({ letter, onDone, onSkip, compact = false }: Props) {
  const strokes = LETTERS[letter];
  const marks = useMemo(() => strokeMarks(strokes), [strokes]);
  const reduced = useSyncExternalStore(subscribe, () => matchMedia(REDUCED).matches, () => false);
  const [current, setCurrent] = useState(0);
  const [trail, setTrail] = useState<Point[] | null>(null);
  const [miss, setMiss] = useState<{ id: number; points: Point[] } | null>(null);
  const [hint, setHint] = useState("");
  const [demo, setDemo] = useState(0); // 0 — показа нет; новый номер перезапускает анимацию
  const svg = useRef<SVGSVGElement>(null);
  const points = useRef<Point[] | null>(null);
  const doneSent = useRef(false);
  const done = current >= strokes.length;

  // «Показать, как писать»: черты прорисовываются тушью по очереди.
  useEffect(() => {
    if (!demo || reduced || !svg.current) return;
    const anims = [...svg.current.querySelectorAll("[data-demo]")].map((el, i) =>
      el.animate([{ strokeDashoffset: 1.05 }, { strokeDashoffset: 0 }], { duration: 900, delay: 300 + i * 1100, easing: "ease-in-out", fill: "both" }));
    return () => anims.forEach((a) => a.cancel());
  }, [demo, reduced]);

  function toField(e: PointerEvent<SVGSVGElement>): Point {
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(e.currentTarget.getScreenCTM()!.inverse());
    return { x: p.x, y: p.y };
  }

  function down(e: PointerEvent<SVGSVGElement>) {
    if (done || !e.isPrimary || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    points.current = [toField(e)];
    setTrail(points.current);
    setMiss(null);
    setHint("");
    setDemo(0);
  }

  function move(e: PointerEvent<SVGSVGElement>) {
    if (!points.current) return;
    points.current = [...points.current, toField(e)];
    setTrail(points.current);
  }

  function up() {
    const pts = points.current;
    if (!pts) return;
    points.current = null;
    setTrail(null);
    const result = checkStroke(pts, strokes[current]);
    if (!result.ok) {
      setHint(HINTS[result.reason](current + 1));
      if (!reduced) setMiss({ id: Date.now(), points: pts });
      return;
    }
    setCurrent(current + 1);
    if (current + 1 === strokes.length && !doneSent.current) {
      doneSent.current = true;
      onDone();
    }
  }

  function clear() {
    points.current = null;
    setTrail(null);
    setMiss(null);
    setHint("");
    setDemo(0);
    setCurrent(0);
  }

  // Номера и стрелки: при показе — у всех черт, иначе — только у текущей.
  const marked = demo ? marks.map((m, i) => ({ ...m, i })) : done ? [] : [{ ...marks[current], i: current }];

  return (
    <div className="w-full">
      <svg
        ref={svg}
        viewBox="0 0 100 140"
        role="img"
        aria-label={done ? `Буква ${letter} обведена` : `Обведите букву ${letter}: черта ${current + 1} из ${strokes.length}`}
        className="block h-auto w-full cursor-crosshair touch-none rounded-[14px] border border-line bg-surface select-none"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => { points.current = null; setTrail(null); }}
      >
        {/* Направляющие: верх заглавных, линия строчных, базовая. */}
        <g stroke="var(--color-line)" strokeWidth="0.5">
          <line x1="0" x2="100" y1="20" y2="20" />
          <line x1="0" x2="100" y1="55" y2="55" strokeDasharray="2 2" />
          <line x1="0" x2="100" y1="120" y2="120" />
        </g>

        {/* Образец, поверх — пройденные черты акцентом (отдельным слоем, чтобы стыки не перекрывал образец). */}
        <g fill="none" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round">
          <g stroke="var(--color-line)">{strokes.map((d, i) => <path key={i} d={d} />)}</g>
          {/* Только что пройденная черта заливается от начала к концу — в направлении письма. */}
          <g stroke="var(--color-accent)">
            {strokes.slice(0, current).map((d, i) => i === current - 1
              ? <path key={i} d={d} pathLength={1} strokeDasharray="1 2" className="trace-fill" />
              : <path key={i} d={d} />)}
          </g>
        </g>

        {!done && !demo && (
          <path d={strokes[current]} fill="none" stroke="var(--color-muted)" strokeWidth="0.8" strokeDasharray="2 2" strokeLinecap="round" />
        )}

        {demo > 0 && !reduced && (
          <g fill="none" stroke="var(--color-ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            {strokes.map((d, i) => <path key={`${demo}-${i}`} data-demo d={d} pathLength={1} strokeDasharray="1 2" strokeDashoffset="1.05" />)}
          </g>
        )}

        {marked.map(({ start, badge, arrow, i }) => (
          <g key={i} fill="var(--color-ink)">
            {!demo && <circle cx={start.x} cy={start.y} r="4" opacity="0.2" className="origin-center [transform-box:fill-box] motion-safe:animate-ping" />}
            <circle cx={start.x} cy={start.y} r="2.2" />
            {arrow && (
              <path transform={`translate(${arrow.x} ${arrow.y}) rotate(${arrow.angle})`} d="M-3 -3.5 L1.5 0 L-3 3.5" fill="none" stroke="var(--color-ink)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            )}
            <circle cx={badge.x} cy={badge.y} r="5" />
            <text x={badge.x} y={badge.y} dy="0.35em" textAnchor="middle" fontSize="6.5" fontWeight="600" fill="var(--color-paper)">{i + 1}</text>
          </g>
        ))}

        {miss && <polyline key={miss.id} ref={fadeOut} points={polyline(miss.points)} fill="none" stroke="var(--color-ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
        {trail && <polyline points={polyline(trail)} fill="none" stroke="var(--color-ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
      </svg>

      <p aria-live="polite" className={`mt-3 min-h-11 rounded-md px-4 py-2.5 text-[17px] ${done ? "bg-accent-soft font-semibold text-accent" : hint ? "bg-warn-soft" : "text-muted"}`}>
        {done ? `Готово! Буква ${letter} обведена.` : hint || `Ведите от точки ${current + 1} по стрелке`}
      </p>

      {!compact && <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className={btn.soft} onClick={() => { setHint(""); setDemo((n) => n + 1); }}>
          <Icon name="play" /> Показать, как писать
        </button>
        <button type="button" className={btn.soft} onClick={clear}>
          <Icon name="replay" /> Очистить
        </button>
        {onSkip && <button type="button" className={btn.ghost} onClick={onSkip}>Пропустить</button>}
      </div>}
    </div>
  );
}
