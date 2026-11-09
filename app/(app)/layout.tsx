import { PlatformNav, TabBar } from "@/components/platform-nav";
import { Logo } from "@/components/ui";
import { sql } from "@/lib/db";
import { currentDevice } from "@/lib/device-server";

// Платформа: «что мне нужно сделать сейчас?» (ТЗ, п. 15) — разделы и счётчик повторения всегда на виду.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const device = await currentDevice();
  const [{ due }] = await sql<{ due: number }[]>`
    select count(*)::int as due from sign_state where device_id = ${device}::uuid and due_at <= now()`;
  return (
    <>
      <header className="shell flex min-h-[76px] items-center justify-between gap-6 max-md:min-h-[60px]">
        <Logo />
        <PlatformNav dueCount={due} />
      </header>
      <main className="shell pt-4 pb-28 md:pb-20">{children}</main>
      <TabBar dueCount={due} />
    </>
  );
}
