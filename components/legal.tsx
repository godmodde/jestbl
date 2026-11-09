import type { ReactNode } from "react";

// Текстовые страницы: узкая колонка ~65 знаков, метки [ОПЕРАТОР] заполняются перед публикацией.
export function Legal({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main className="shell py-10 lg:py-16">
      <article className="grid max-w-[68ch] gap-5 [&_h2]:mt-6 [&_h2]:mb-0 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-[-0.015em] [&_li]:mt-3 [&_p]:m-0 [&_ul]:m-0 [&_ul]:list-disc [&_ul]:pl-5">
        <h1 className="m-0 font-display text-[clamp(32px,4vw,48px)] leading-[1.05] font-semibold tracking-[-0.03em]">{title}</h1>
        <p className="text-sm text-muted">Редакция от {updated}. Шаблон: перед публикацией заполните поля в квадратных скобках и покажите текст юристу.</p>
        {children}
      </article>
    </main>
  );
}
