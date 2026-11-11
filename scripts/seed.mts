// Загружает content/content.mts в базу. Повторный запуск обновляет контент по slug и не трогает прогресс учеников.
// Запуск: pnpm db:seed
import postgres from "postgres";

import { checkContent, seedContent, type Tx } from "../content/seed.mts";

checkContent();

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL не задан — скопируйте .env.example в .env.local");
const sql = postgres(url, { max: 1, onnotice: () => {} });

try {
  await sql.begin((tx) => seedContent(tx as unknown as Tx));
  const [counts] = await sql`select (select count(*) from signs)::int as signs, (select count(*) from categories)::int as categories,
    (select count(*) from topics)::int as topics, (select count(*) from lessons)::int as lessons,
    (select count(*) from lesson_signs)::int as lesson_signs, (select count(*) from sign_similar)::int as similar`;
  console.log("контент загружен:", counts);
} finally {
  await sql.end();
}
