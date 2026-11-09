import { ButtonLink } from "@/components/ui";

// Текст 404 без шапки и полей: внутри платформы и урока его оборачивает их собственный макет.
export function NotFoundMessage() {
  return (
    <>
      <h1 className="m-0 font-display text-[clamp(36px,5vw,64px)] leading-none font-semibold tracking-[-0.035em]">Такой страницы нет</h1>
      <p className="m-0 max-w-[48ch] text-lg text-ink-2">Возможно, ссылка устарела.</p>
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/learn">К обучению</ButtonLink>
        <ButtonLink href="/dictionary" variant="ghost">Словарь</ButtonLink>
      </div>
    </>
  );
}
