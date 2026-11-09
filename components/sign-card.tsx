import Link from "next/link";
import type { ReactNode } from "react";

import { ReviewBadge } from "@/components/ui";
import { nbsp } from "@/lib/typo";

type CardSign = {
  title: string;
  gloss: string;
  meaning: string;
  howTo: string | null;
  context: string | null;
  notice: string | null;
  needsReview: boolean;
};

// Обучающая карточка (ТЗ, п. 18): главное открыто сразу, дополнительное — по желанию.
// Карточки разные по наполнению: пустые поля просто не показываем.
export function SignCard({ sign, similar = [], actions, headingLevel = 2 }: {
  sign: CardSign;
  similar?: { slug: string; title: string; note: string }[];
  actions?: ReactNode;
  headingLevel?: 1 | 2;
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const more = sign.context || similar.length > 0;
  return (
    <article className="grid gap-6">
      <header className="grid gap-2">
        <Heading className="m-0 font-display text-[32px] leading-[1.1] font-semibold tracking-[-0.02em]">{sign.title}</Heading>
        {sign.needsReview && <ReviewBadge />}
      </header>

      <dl className="m-0 grid gap-4">
        <div className="grid gap-1">
          <dt className="text-[13px] font-semibold text-muted">Что означает</dt>
          <dd className="m-0 text-[17px]">{nbsp(sign.meaning)}</dd>
        </div>
        {sign.howTo && (
          <div className="grid gap-1">
            <dt className="text-[13px] font-semibold text-muted">Как выполняется</dt>
            <dd className="m-0">{nbsp(sign.howTo)}</dd>
          </div>
        )}
      </dl>

      {sign.notice && (
        <div className="grid gap-1 rounded-md bg-accent-soft px-4 py-3">
          <span className="text-[13px] font-semibold text-accent">Обратите внимание</span>
          <p className="m-0">{nbsp(sign.notice)}</p>
        </div>
      )}

      {more && (
        <details className="group rounded-md border border-line px-4 py-3 open:pb-4">
          <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between font-medium">
            {sign.context ? "В контексте" : "Похожие жесты"}
            <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-45">+</span>
          </summary>
          <div className="mt-2 grid gap-4">
            {sign.context && <p className="m-0 text-ink-2">{nbsp(sign.context)}</p>}
            {similar.length > 0 && (
              <div className="grid gap-2">
                {sign.context && <span className="text-[13px] font-semibold text-muted">Похожие жесты</span>}
                <ul className="m-0 grid list-none gap-2 p-0">
                  {similar.map((s) => (
                    <li key={s.slug}>
                      <Link href={`/dictionary/${s.slug}`} className="font-semibold underline underline-offset-2 hover:text-accent">{s.title}</Link>
                      <span className="text-ink-2"> — {nbsp(s.note)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>
      )}

      {actions}
    </article>
  );
}

/** Плоская карточка для панелей главной: те же поля, но без вложенных рамок и аккордеона — панель и есть карточка.
 *  Название — курсивом, голосом жеста, как в hero. */
export function SignBrief({ sign }: { sign: CardSign }) {
  // Подпись → текст 4 < поле плашки 10 < между частями 12/16.
  return (
    <div className="grid content-start gap-3 lg:gap-4">
      <div className="grid justify-items-start gap-2">
        <span className="type-gloss text-[clamp(30px,2.6vw,40px)] leading-none font-medium tracking-[-0.02em]">{sign.title}</span>
        {sign.needsReview && <ReviewBadge />}
      </div>
      <div className="grid gap-1"><span className="text-[13px] font-semibold text-muted">Что означает</span><span className="text-[17px]">{nbsp(sign.meaning)}</span></div>
      {sign.howTo && <div className="grid gap-1"><span className="text-[13px] font-semibold text-muted">Как выполняется</span><span className="text-ink-2">{nbsp(sign.howTo)}</span></div>}
      {sign.notice && (
        <div className="grid gap-1 rounded-md bg-accent-soft px-3 py-2.5">
          <span className="text-[13px] font-semibold text-accent">Обратите внимание</span>
          <span>{nbsp(sign.notice)}</span>
        </div>
      )}
    </div>
  );
}

/** Карточка плашками («Разбираем» на главной): иерархия по весу — главное значение во всю ширину и крупнее,
 *  ниже рядом «как выполняется» и акцентное «обратите внимание», последним тихий «контекст».
 *  Отступы по правилу внутреннего и внешнего: подпись → текст 6 < поле плашки 16/20 < между плашками 20/24 < название → плашки 24/32 ≤ поле панели. */
export function SignTiles({ sign }: { sign: CardSign }) {
  // Плашки наводятся в резкость по очереди, в порядке чтения (шаг 70 мс, всего до 0,3 с).
  const tile = "anim-focus-in grid content-start gap-1.5 rounded-[20px] p-4 md:p-5";
  const label = "text-[13px] font-semibold";
  return (
    <div className="grid gap-6 md:gap-8">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <span className="type-gloss text-[clamp(32px,3vw,44px)] leading-none font-medium tracking-[-0.02em]">{sign.title}</span>
        {sign.needsReview && <ReviewBadge />}
      </div>
      <div className="grid gap-5 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:gap-6">
        <div className={`${tile} bg-surface [--d:70ms] md:col-span-2`}>
          <span className={`${label} text-muted`}>Что означает</span>
          <span className="text-[clamp(18px,1.5vw,22px)] leading-snug font-medium">{nbsp(sign.meaning)}</span>
        </div>
        {sign.howTo && (
          <div className={`${tile} bg-surface [--d:140ms] ${sign.notice ? "" : "md:col-span-2"}`}>
            <span className={`${label} text-muted`}>Как выполняется</span>
            <span className="text-ink-2">{nbsp(sign.howTo)}</span>
          </div>
        )}
        {sign.notice && (
          <div className={`${tile} bg-accent-soft [--d:210ms] ${sign.howTo ? "" : "md:col-span-2"}`}>
            <span className={`${label} text-accent`}>Обратите внимание</span>
            <span>{nbsp(sign.notice)}</span>
          </div>
        )}
        {sign.context && (
          <div className={`${tile} border border-line [--d:280ms] md:col-span-2`}>
            <span className={`${label} text-muted`}>В контексте</span>
            <span className="text-[15px] text-ink-2">{nbsp(sign.context)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
