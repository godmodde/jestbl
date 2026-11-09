// Урок — без лишней навигации: человек думает о языке, а не об интерфейсе (ТЗ, п. 02).
export default function LessonLayout({ children }: { children: React.ReactNode }) {
  return <main className="shell pt-6">{children}</main>;
}
