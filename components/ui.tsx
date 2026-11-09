import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// Мелкие общие элементы: логотип, кнопки-ссылки, иконки. Кнопки ≥ 44 px (ТЗ, п. 28).

export function Logo({ withTagline = true }: { withTagline?: boolean }) {
  return (
    <Link href="/" className="flex flex-col items-start gap-1 sm:flex-row sm:items-baseline sm:gap-2.5" aria-label="Видно — школа русского жестового языка, на главную">
      <span className="font-display text-2xl leading-none font-bold tracking-[-0.02em]">Видно</span>
      {/* Расшифровка видна и на телефоне. На сайте её заменяет надзаголовок первого экрана, в платформе и подвале — она здесь. */}
      {withTagline && <span className="text-[11px] leading-none text-muted sm:text-[13px]">русский жестовый язык</span>}
    </Link>
  );
}

const base = "press inline-flex items-center justify-center gap-2.5 rounded-full font-semibold";
export const btn = {
  primary: `${base} min-h-14 px-7 text-[17px] bg-accent text-white hover:bg-accent-strong`,
  primarySm: `${base} min-h-12 px-6 bg-accent text-white hover:bg-accent-strong`,
  ghost: `${base} min-h-11 px-5 border-[1.5px] border-ink hover:bg-ink hover:text-paper`,
  soft: `${base} min-h-11 px-5 bg-track hover:bg-line`,
};

export function ButtonLink({ variant = "primary", className = "", ...props }: ComponentProps<typeof Link> & { variant?: keyof typeof btn }) {
  return <Link {...props} className={`${btn[variant]} group ${className}`} />;
}

export function Arrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform duration-250 motion-safe:group-hover:translate-x-1">
      <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function Icon({ name, size = 18 }: { name: "play" | "pause" | "replay" | "star" | "star-fill" | "repeat" | "back" | "check" | "learn" | "book" | "cards" | "progress" | "lock" | "user" | "plus"; size?: number }) {
  const paths: Record<typeof name, ReactNode> = {
    play: <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none" />,
    pause: <><path d="M9 5v14" /><path d="M15 5v14" /></>,
    replay: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></>,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z" />,
    "star-fill": <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z" fill="currentColor" />,
    repeat: <><path d="M17 2l4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" /></>,
    back: <><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></>,
    check: <path d="m5 12 5 5L20 7" />,
    learn: <><path d="M4 19V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z" /><path d="M8 7h6" /></>,
    book: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
    cards: <><rect x="3" y="6" width="14" height="14" rx="2" /><path d="M7 3h12a2 2 0 0 1 2 2v12" /></>,
    progress: <><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M21 20H3" /></>,
    lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export function ReviewBadge() {
  return (
    <span className="inline-flex w-fit items-center rounded-full bg-warn-soft px-2.5 py-0.5 text-xs font-medium text-ink-2">
      Черновик · требует проверки носителем РЖЯ
    </span>
  );
}
