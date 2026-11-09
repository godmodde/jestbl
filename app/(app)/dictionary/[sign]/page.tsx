import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SignActions } from "@/components/sign-actions";
import { SignCard } from "@/components/sign-card";
import { Icon } from "@/components/ui";
import { VideoPlayer } from "@/components/video-player";
import { getSign } from "@/lib/data";
import { currentDevice } from "@/lib/device-server";

type Props = { params: Promise<{ sign: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getSign(null, (await params).sign);
  return data ? { title: `Жест «${data.sign.title}»`, description: data.sign.meaning } : { title: "Жест не найден" };
}

// Та же карточка, что в уроке и повторении (ТЗ, п. 20) — один жест, одна карточка.
export default async function SignPage({ params }: Props) {
  const data = await getSign(await currentDevice(), (await params).sign);
  if (!data) notFound();
  const { sign, state, similar, lessons } = data;
  return (
    <div className="grid gap-12 lg:gap-14">
      <Link href="/dictionary" className="inline-flex min-h-11 w-fit items-center gap-2 font-medium hover:text-accent">
        <Icon name="back" /> Словарь
      </Link>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start 2xl:grid-cols-[minmax(0,1fr)_minmax(0,600px)]">
        <VideoPlayer src={sign.videoUrl} label={`Жест «${sign.title}»`} autoPlay bleed source={sign.sourceUrl} className="lg:max-w-[min(100%,calc((100svh-330px)*16/9))]" />
        <div className="grid gap-8">
          <SignCard sign={sign} similar={similar} headingLevel={1}
            actions={<SignActions slug={sign.slug} favorite={state.favorite} inReview={state.inReview} />} />
          {lessons.length > 0 && (
            <div className="grid gap-2">
              <span className="text-[13px] font-semibold text-muted">Встречается в уроках</span>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {lessons.map((l) => (
                  <li key={l.slug}>
                    <Link href={`/learn/${l.slug}`} className="inline-flex min-h-11 items-center rounded-full bg-surface px-4 font-medium hover:bg-track">{l.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
