import { notFound } from "next/navigation";

import { Faq, ReviewsPlaceholder, SectionHead, TeachersPlaceholder, TopicPath } from "@/components/landing";
import { HowItWorks } from "@/components/landing-client";
import { Directions, HeroCollage, PlatformLive } from "@/components/landing-live";
import { Arrow, ButtonLink } from "@/components/ui";
import { demoVideos, getLearnHome, getSign } from "@/lib/data";
import { currentDevice } from "@/lib/device-server";
import { getDactylTemplates } from "@/lib/handshape-templates";

// Главная продаёт демонстрацией (ТЗ, п. 4): каждая секция — работающий кусок платформы, у каждой своя композиция.
// Заголовок до шести слов, текста не больше строки (решение заказчика 2026-10-10).
export default async function HomePage() {
  const device = await currentDevice();
  const [hero, howSign, bye, spasibo, sorry, adult, learn, like, kot, sobaka, ryba, home, templates] = await Promise.all([
    getSign(device, "zdravstvuj"), getSign(device, "pozhalujsta"), getSign(device, "do-svidaniya"), getSign(device, "spasibo"), getSign(device, "izvinyatsya"),
    // Колонка «Взрослым»: короткое слово — вшитая подпись демо-ролика целиком уходит за край кадра.
    getSign(null, "semya"),
    // Коллаж первого экрана: 1 — «Здравствуй», 2 — «Учиться», 3 — «Просто». Заказчик просил «Давай учиться» и «Легко» —
    // на surdo.media их нет; после своих съёмок подписи заменить (docs/video-brief.md, решения заказчика 2026-10-10).
    getSign(null, "uchitsya"), getSign(null, "prosto"),
    getSign(null, "kot"), getSign(null, "sobaka"), getSign(null, "ryba"),
    getLearnHome(device), getDactylTemplates(),
  ]);
  if (!hero || !howSign || !bye || !spasibo || !sorry || !adult || !learn || !like || !kot || !sobaka || !ryba) notFound();
  const first = home.topics.find((t) => t.status === "open")?.lessons[0];
  const firstHref = `/learn/${first?.slug ?? "zdorovaemsya"}`;
  // Прогресс первого урока этого устройства: «Платформа в действии» показывает настоящие цифры.
  const lesson = [hero, bye, spasibo, howSign, sorry];
  const lessonSigns = lesson.map((s) => ({ slug: s.sign.slug, title: s.sign.title }));
  const learned = lesson.filter((s) => s.state.learned).map((s) => s.sign.slug);
  const options = [
    { slug: "pozhalujsta", title: "Пожалуйста" },
    { slug: "spasibo", title: "Спасибо" },
    { slug: "do-svidaniya", title: "До свидания" },
  ];
  const pic = (s: NonNullable<typeof kot>) => ({ slug: s.sign.slug, title: s.sign.title, picture: s.sign.picture, videoUrl: s.sign.videoUrl });

  const faq = [
    { q: "Можно ли начать с нуля?", a: "Да. Первый урок — пять жестов для приветствия и вежливости." },
    { q: "Сколько длится урок?", a: "Около 10 минут. Можно прерваться и продолжить с того же места." },
    { q: "Можно ли учиться с телефона?", a: "Да. На телефоне видео — во всю ширину экрана." },
    {
      q: "Кто показывает жесты?",
      a: demoVideos
        ? "Носители русского жестового языка. В демо — видео словаря surdo.media, свои съёмки готовятся."
        : "Носители русского жестового языка. Видео снимаются — пока на их месте заглушки.",
    },
    { q: "С какого возраста детям?", a: "Для 3–5 и 6–12 лет: малышам игры проще. Читать не нужно — всё понятно по картинкам и жестам." },
    ...(templates ? [{ q: "Зачем камера и куда уходит видео?", a: "Камера проверяет, как вы показываете буквы. Видео не покидает браузер. Можно и без камеры." }] : []),
  ];

  return (
    <main className="bands">
      <HeroCollage signs={[hero.sign, learn.sign, like.sign]} />

      <section id="how" aria-labelledby="how-title" className="shell grid scroll-mt-6 gap-10 py-16 lg:gap-12 lg:py-28">
        <SectionHead id="how-title" title="Сначала посмотрим, потом попробуем" />
        {/* ponytail: 0,1–2,9 с — первый вариант «Пожалуйста» анфас в демо-ролике surdo.media; для своих съёмок отрезок убрать. */}
        <HowItWorks sign={howSign.sign} options={options} clip={[0.1, 2.9]} />
      </section>

      <section id="directions" aria-labelledby="directions-title" className="shell grid scroll-mt-6 gap-10 py-16 lg:gap-12 lg:py-28">
        <SectionHead id="directions-title" title="Три направления" />
        <Directions letter="А" adult={adult.sign} kids={{ sign: pic(kot), options: [pic(sobaka), pic(kot), pic(ryba)] }} />
      </section>

      <section id="path" aria-labelledby="path-title" className="shell grid scroll-mt-6 gap-12 py-16 lg:gap-14 lg:py-32">
        <SectionHead id="path-title" title="Начнём с простого" />
        <TopicPath topics={home.topics} />
      </section>

      {demoVideos && (
        <section aria-labelledby="teachers" className="shell grid gap-10 py-16 lg:gap-12 lg:py-28">
          <SectionHead id="teachers" title="Учимся у носителей языка" />
          <TeachersPlaceholder />
        </section>
      )}

      {/* Секция — высотой с экран, панель внутри по центру: всё задание видно без прокрутки. */}
      <section id="platform" aria-labelledby="platform-title" className="shell grid scroll-mt-6 gap-10 py-16 lg:min-h-svh lg:content-center lg:gap-12 lg:py-12">
        <SectionHead id="platform-title" title="Попробуйте прямо здесь" />
        <PlatformLive sign={spasibo.sign} choices={[sorry.sign, spasibo.sign, bye.sign]} lesson={lessonSigns} learned={learned} />
      </section>

      {demoVideos && (
        <section id="reviews" aria-labelledby="reviews-title" className="shell grid scroll-mt-6 gap-10 py-16 lg:py-32">
          <h2 id="reviews-title" className="sr-only">Отзывы учеников</h2>
          <ReviewsPlaceholder />
        </section>
      )}

      <section id="faq" aria-labelledby="faq-title" className="shell grid scroll-mt-6 gap-10 py-16 lg:gap-14 lg:py-28">
        <SectionHead id="faq-title" title="Вопросы перед началом" />
        <Faq items={faq} />
      </section>

      <section aria-labelledby="final" className="shell grid justify-items-center gap-8 py-20 text-center lg:py-40">
        <h2 id="final" className="m-0 max-w-[14ch] font-display text-[clamp(48px,8vw,128px)] leading-[0.92] font-semibold tracking-[-0.045em]">
          Попробуйте <span className="type-gloss">один урок</span>
        </h2>
        <ButtonLink href={firstHref}>Начать первый урок <Arrow /></ButtonLink>
        <p className="m-0 text-muted">Можно с нуля · в своём темпе</p>
      </section>
    </main>
  );
}
