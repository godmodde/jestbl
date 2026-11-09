// Шаблон пересоздаётся при каждом переходе: страница плавно проявляется (просьба заказчика 2026-10-10). Шапка группы — в layout, она не мигает.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="anim-page">{children}</div>;
}
