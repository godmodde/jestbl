import Link from "next/link";
import type { CSSProperties } from "react";

import { Icon } from "@/components/ui";
import type { LessonSummary } from "@/lib/data";
import { plural } from "@/lib/plural";
import { nbsp } from "@/lib/typo";

// Секции главной (ТЗ, ч. I). Каждая отвечает на один вопрос человека, который впервые открыл сайт.

// Без надзаголовков над заголовком: заголовок говорит сам (планка качества, проверка 2026-10-09).
export function SectionHead({ id, title, lead }: { id?: string; title: string; lead?: string }) {
  return (
    <div className="grid max-w-3xl gap-4">
      <h2 id={id} className="m-0 font-display text-[clamp(34px,4.4vw,60px)] leading-[1.02] font-semibold tracking-[-0.035em]">{nbsp(title)}</h2>
      {lead && <p className="m-0 max-w-[52ch] text-lg text-ink-2">{nbsp(lead)}</p>}
    </div>
  );
}

type Topic = { slug: string; title: string; description: string; status: "open" | "soon"; lessons: LessonSummary[] };

/** Путь обучения (ТЗ, п. 4): одна линия, четыре остановки — куда я двигаюсь, без каталога. */
export function TopicPath({ topics }: { topics: Topic[] }) {
  return (
    <ol className="relative m-0 grid list-none gap-10 p-0 lg:grid-cols-4 lg:gap-8">
      <span aria-hidden="true" className="draw-line absolute top-7 right-0 left-7 hidden h-0.5 bg-line lg:block" />
      <span aria-hidden="true" className="absolute top-7 bottom-7 left-7 w-0.5 bg-line lg:hidden" />
      {topics.map((t, i) => (
        <li key={t.slug} className="on-view relative grid content-start gap-2 pl-20 lg:pl-0">
          {/* Кружок зажигается, когда до него дотягивается линия пути. */}
          <span style={{ "--i": i } as CSSProperties} className={`stop-in absolute top-0 left-0 grid size-14 place-content-center rounded-full font-display text-xl font-semibold tabular-nums lg:relative ${t.status === "open" ? "bg-accent text-white" : "border-[1.5px] border-line bg-(--band) text-muted"}`}>
            {i + 1}
          </span>
          {t.status === "open" ? (
            <Link href={`/learn/${t.lessons[0]?.slug ?? ""}`} className="font-display text-[clamp(24px,2.2vw,32px)] leading-tight font-semibold tracking-[-0.025em] underline decoration-transparent decoration-[1.5px] underline-offset-[6px] transition-[text-decoration-color] duration-300 hover:decoration-current lg:mt-5">{t.title}</Link>
          ) : (
            <span className="font-display text-[clamp(24px,2.2vw,32px)] leading-tight font-semibold tracking-[-0.025em] text-ink-2 lg:mt-5">{t.title}</span>
          )}
          <span className="text-sm text-muted">{t.status === "open" ? `Открыта · ${t.lessons.length} ${plural(t.lessons.length, ["урок", "урока", "уроков"])}` : "Готовится"}</span>
        </li>
      ))}
    </ol>
  );
}

/** Преподаватели и отзывы — только настоящие (ТЗ, п. 4). Пока их нет, в демо видны явные заглушки, на опубликованном сайте секций нет. */
export function TeachersPlaceholder() {
  // Одна заглушка в языке видео мира: кадр 16:9 в белой рамке — так здесь будет стоять видео-знакомство с преподавателем.
  return (
    <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-14">
      <div className="m-2.5 grid aspect-video place-content-center justify-items-center gap-3 rounded-[22px] bg-frame/60 text-muted shadow-[0_0_0_1px_rgba(29,28,26,0.06),0_0_0_10px_#fff,0_1px_2px_10px_rgba(29,28,26,0.05),0_40px_80px_-36px_rgba(29,28,26,0.45)]">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
        <span className="text-sm font-medium">Видео преподавателя</span>
      </div>
      <p className="m-0 max-w-[24ch] font-display text-[clamp(24px,2.4vw,32px)] leading-tight font-semibold tracking-[-0.02em] text-muted">Имена и опыт преподавателей — после съёмок</p>
    </div>
  );
}

export function ReviewsPlaceholder() {
  return (
    <figure className="m-0 grid max-w-4xl gap-6">
      <span aria-hidden="true" className="font-display text-[120px] leading-[0.5] text-line">«</span>
      <blockquote className="m-0 font-display text-[clamp(28px,3.4vw,48px)] leading-[1.1] font-semibold tracking-[-0.03em] text-muted">
        Здесь будет отзыв ученика
      </blockquote>
      <figcaption className="text-muted">Только настоящие отзывы, с согласия авторов</figcaption>
    </figure>
  );
}

/** Вопросы двумя столбцами: у каждого столбца своя высота — раскрытый ответ не двигает соседний столбец. */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const half = Math.ceil(items.length / 2);
  return (
    <div className="grid gap-x-16 md:grid-cols-2 md:items-start">
      {[items.slice(0, half), items.slice(half)].map((col, i) => (
        <div key={i} className={`grid border-t border-line ${i ? "max-md:border-t-0" : ""}`}>
          {col.map((f) => (
            <details key={f.q} className="faq group border-b border-line">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-4 text-lg font-medium">
                {nbsp(f.q)}
                {/* Плюс наливается тушью и поворачивается в крестик — вопрос открыт. */}
                <span aria-hidden="true" className="ink-dot grid size-9 flex-none place-content-center rounded-full border border-line transition-[rotate,color] duration-400 ease-[cubic-bezier(.16,1,.3,1)] group-open:rotate-45"><Icon name="plus" size={16} /></span>
              </summary>
              <p className="m-0 max-w-[62ch] pb-6 text-ink-2">{nbsp(f.a)}</p>
            </details>
          ))}
        </div>
      ))}
    </div>
  );
}
