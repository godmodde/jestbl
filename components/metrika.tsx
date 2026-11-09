"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { Suspense, useEffect, useRef } from "react";

declare global {
  interface Window { ym?: (id: number, action: string, ...args: unknown[]) => void }
}

// Переходы внутри сайта не перезагружают страницу — отправляем их в Метрику как просмотры.
function Hits({ id }: { id: number }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    window.ym?.(id, "hit", window.location.href);
  }, [id, pathname, search]);
  return null;
}

export function Metrika({ id }: { id: string }) {
  return (
    <>
      <Script id="ym" strategy="afterInteractive">{`
        (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();
        for (var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
        (window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
        ym(${Number(id)},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:false});
      `}</Script>
      <Suspense fallback={null}><Hits id={Number(id)} /></Suspense>
    </>
  );
}
