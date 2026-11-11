import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Рядом лежат другие проекты с pnpm — корень указываем явно, иначе Turbopack выбирает родительскую папку.
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },
  // Значок Next в углу перекрывает нижние кнопки на телефоне.
  devIndicators: false,
  // Сайт смотрят через прокси Coder: без этого Next блокирует dev-ресурсы, и страница остаётся без гидратации.
  allowedDevOrigins: ["*.devgreenboxweb.ru", "127.0.0.1"],
  // Встроенная база без DATABASE_URL (lib/db-demo.ts): PGlite грузит свои .wasm/.data рядом с собой, миграции читаются с диска —
  // пакет не собираем в бандл, а файлы явно кладём в серверные функции.
  serverExternalPackages: ["@electric-sql/pglite"],
  outputFileTracingIncludes: { "/**": ["./db/migrations/*.sql", "./node_modules/@electric-sql/pglite/dist/*.{wasm,data}"] },
};

export default nextConfig;
