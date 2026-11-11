// Плюш для вариантов макета 2 и 3 (референсы Леры, 2026-11-10): мех — SVG-фильтры поверх обычной разметки.
// В исходнике (вариант 1) фильтры не применяются: классы .fluffy, .plush-pad и .plush-text в globals.css включаются только по data-v.

/** Фильтры подключаются один раз на страницу (корневой layout). */
export function PlushDefs() {
  const shade = (std: number, scale: number, kd = 1.5, el = 54) => (
    <>
      <feGaussianBlur in="SourceAlpha" stdDeviation={std} result="b" />
      <feDiffuseLighting in="b" surfaceScale={scale} diffuseConstant={kd} lightingColor="#fff" result="d"><feDistantLight azimuth={235} elevation={el} /></feDiffuseLighting>
      <feComposite in="SourceGraphic" in2="d" operator="arithmetic" k1={1} result="sh" />
    </>
  );
  // Плюш: короткий мягкий ворс — два слоя сдвига шумом и лёгкий пух по краю, светлые волоски.
  // Тёмных волосков и длинных прядей нет: с ними мех выходил мрачным и колючим (заказчик 2026-11-11).
  const fur = (s: number) => (
    <>
      <feTurbulence type="fractalNoise" baseFrequency={0.6 / s} numOctaves={2} seed={3} result="n1" />
      <feDisplacementMap in="sh" in2="n1" scale={10 * s} xChannelSelector="R" yChannelSelector="G" result="f1" />
      <feTurbulence type="fractalNoise" baseFrequency={0.35 / s} numOctaves={2} seed={11} result="n2" />
      <feDisplacementMap in="sh" in2="n2" scale={7 * s} xChannelSelector="G" yChannelSelector="B" result="f2" />
      <feTurbulence type="fractalNoise" baseFrequency={`${0.9 / s} ${0.5 / s}`} numOctaves={2} seed={21} result="n3" />
      <feDisplacementMap in="sh" in2="n3" scale={15 * s} xChannelSelector="R" yChannelSelector="G" result="f3" />
      <feComponentTransfer in="f3" result="halo"><feFuncA type="linear" slope={0.35} /></feComponentTransfer>
      <feMerge result="fz"><feMergeNode in="halo" /><feMergeNode in="f1" /><feMergeNode in="f2" /></feMerge>
      <feColorMatrix in="n1" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  2.2 0 0 0 -1.05" result="hi" />
      <feComposite in="hi" in2="fz" operator="in" result="hiIn" />
      <feComponentTransfer in="hiIn" result="hiS"><feFuncA type="linear" slope={0.4} /></feComponentTransfer>
      <feMerge result="m"><feMergeNode in="fz" /><feMergeNode in="hiS" /></feMerge>
      <feGaussianBlur in="m" stdDeviation={0.9 * s} result="soft" />
    </>
  );
  const box = { x: "-30%", y: "-30%", width: "160%", height: "160%", colorInterpolationFilters: "sRGB" as const };
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" className="pointer-events-none absolute">
      <defs>
        <filter id="fur" {...box}>
          {shade(12, 7, 1.72, 62)}{fur(1)}
          {/* Мягкий блик сверху: объём без тёмного низа. */}
          <feGaussianBlur in="SourceAlpha" stdDeviation="14" result="hb" />
          <feSpecularLighting in="hb" surfaceScale="6" specularConstant=".45" specularExponent="10" lightingColor="#fff" result="spec"><fePointLight x="-120" y="-220" z="320" /></feSpecularLighting>
          <feComposite in="spec" in2="soft" operator="in" result="specIn" />
          <feComposite in="soft" in2="specIn" operator="arithmetic" k2="1" k3=".55" result="lit" />
          <feDropShadow in="lit" dx="0" dy="10" stdDeviation="14" floodColor="#7A5A6E" floodOpacity=".16" />
        </filter>
        <filter id="fur-m" {...box}>{shade(3, 2, 1.6, 66)}{fur(0.22)}<feDropShadow in="soft" dx="0" dy="3" stdDeviation="4" floodColor="#7A5A6E" floodOpacity=".16" /></filter>
        <filter id="fur-t" {...box}>{shade(5, 3, 1.6, 66)}{fur(0.5)}<feDropShadow in="soft" dx="0" dy="5" stdDeviation="7" floodColor="#7A5A6E" floodOpacity=".16" /></filter>
      </defs>
    </svg>
  );
}

/** Плюшевый заголовок детского мира: буквы разных цветов, мех или фетр. В исходнике — обычный текст. */
export function PlushText({ text, small = false }: { text: string; small?: boolean }) {
  return (
    <>
      <span className="sr-only">{text}</span>
      <span className={`plush-text ${small ? "plush-sm" : ""}`} aria-hidden="true">{Array.from(text).map((ch, i) => <span key={i}>{ch}</span>)}</span>
    </>
  );
}
