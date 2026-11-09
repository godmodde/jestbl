import Link from "next/link";

import { NavPill, type Section } from "@/components/nav-pill";
import { Icon, Logo } from "@/components/ui";
import { demoVideos } from "@/lib/data";
import { nbsp } from "@/lib/typo";

// Якоря разделов главной — одни на шапку и подвал, в порядке страницы. «Отзывы» — по тому же условию, что и сам раздел
// (пока он только в демо): ссылки в никуда на опубликованном сайте не будет.
const SECTIONS: Section[] = [
  { id: "how", label: "Как учимся" },
  { id: "directions", label: "Направления" },
  { id: "path", label: "Путь" },
  { id: "platform", label: "Попробовать" },
  ...(demoVideos ? [{ id: "reviews", label: "Отзывы" }] : []),
  { id: "faq", label: "Вопросы" },
];

// Навигация главной — спокойная и компактная (ТЗ, п. 04): только ссылки, единственная кнопка экрана — в hero. «Войти» нет — входа в v1 нет.
export function SiteHeader() {
  return (
    <header className="shell grid min-h-[88px] grid-cols-[auto_1fr_auto] items-center justify-items-start gap-x-3 max-md:min-h-[60px] sm:gap-x-6 xl:grid-cols-[1fr_auto_1fr]">
      {/* С 1280 px пилюля — ровно по центру страницы; уже — по центру места между логотипом и ссылками. */}
      {/* Без расшифровки: на главной «Русский жестовый язык» стоит над заголовком первого экрана, дважды подряд не повторяем. */}
      <Logo withTagline={false} />
      {/* По центру — якоря разделов (при прокрутке пилюля уезжает вниз, components/nav-pill.tsx); справа — страницы. */}
      <NavPill items={SECTIONS} />
      <nav aria-label="Быстрые ссылки" className="col-start-3 flex items-center gap-x-1 justify-self-end text-[15px] font-medium">
        <Link href="/dictionary" className="inline-flex min-h-11 items-center px-2 text-sm transition-colors hover:text-accent sm:px-2.5 sm:text-[15px]">Словарь</Link>
        <Link href="/learn" className="inline-flex min-h-11 items-center px-2 text-sm transition-colors hover:text-accent sm:px-2.5 sm:text-[15px]">Обучение</Link>
        {/* На 360 px логотип, две ссылки и кабинет помещаются впритык: на телефоне ссылки на 1 px мельче, поля уже. */}
        {/* Кабинет: входа нет, прогресс хранится за устройством — кабинет и есть страница прогресса. */}
        <Link href="/progress" aria-label="Личный кабинет" title="Личный кабинет"
          className="group ink-dot press ml-1.5 grid size-11 place-content-center rounded-full border border-line bg-surface/60">
          <Icon name="user" size={20} />
        </Link>
      </nav>
    </header>
  );
}

const FOOTER: { title: string; links: [string, string][]; wide?: boolean }[] = [
  { title: "На главной", links: SECTIONS.map((s) => [`/#${s.id}`, s.label]) },
  { title: "Платформа", links: [["/learn", "Обучение"], ["/alphabet", "Алфавит"], ["/adults", "Взрослым"], ["/kids", "Детям"], ["/dictionary", "Словарь"], ["/review", "Повторение"], ["/progress", "Прогресс"]] },
  { title: "Документы", links: [["/privacy", "Политика конфиденциальности"], ["/cookies", "Cookie и Метрика"]], wide: true },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      {/* Правило внутреннего и внешнего: подпись группы → ссылки 14 < между ссылками 20 < между группами 32/64 < описание ↔ ссылки 48/64. */}
      <div className="shell grid gap-12 pt-12 pb-[calc(112px+env(safe-area-inset-bottom))] lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
        <div className="grid max-w-md content-start gap-3">
          <Logo />
          <p className="m-0 text-sm text-muted">
            {nbsp("Материалы — черновик: жесты и тексты проверяют носители русского жестового языка.")}
            {demoVideos && nbsp(" Видео демо — из словаря surdo.media, только для локального показа.")}
          </p>
        </div>
        <nav aria-label="Ссылки в подвале" className="grid grid-cols-2 gap-8 text-[15px] sm:grid-cols-3 sm:gap-x-16">
          {FOOTER.map((g) => (
            <div key={g.title} className={`grid content-start gap-1 ${g.wide ? "max-sm:col-span-2" : ""}`}>
              <p className="m-0 text-sm text-muted">{g.title}</p>
              <ul className="m-0 grid list-none content-start p-0">
                {g.links.map(([href, label]) => (
                  <li key={href}><Link href={href} className="inline-flex min-h-11 items-center hover:text-accent">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </footer>
  );
}
