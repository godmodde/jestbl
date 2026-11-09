// Алфавит: 33 буквы дактильной азбуки как жесты kind "letter" и 6 уроков-групп (ТЗ, п. 5, «Направление 01»).
// Видео — surdo.media, раздел «Алфавит» (32 буквы). У Ё видео там нет — карточка без видео.
import type { SignInput } from "./content.mts";

export const letterSigns: SignInput[] = [
  { slug: "bukva-a", title: "А", category: "alfavit", kind: "letter", video: "2023/07/a.mp4", source: "/topics/alfavit/a/", meaning: "Буква А дактильной азбуки." },
  { slug: "bukva-b", title: "Б", category: "alfavit", kind: "letter", video: "2023/07/b.mp4", source: "/topics/alfavit/b/", meaning: "Буква Б дактильной азбуки." },
  { slug: "bukva-v", title: "В", category: "alfavit", kind: "letter", video: "2023/07/v.mp4", source: "/topics/alfavit/v/", meaning: "Буква В дактильной азбуки." },
  { slug: "bukva-g", title: "Г", category: "alfavit", kind: "letter", video: "2023/07/g.mp4", source: "/topics/alfavit/g/", meaning: "Буква Г дактильной азбуки." },
  { slug: "bukva-d", title: "Д", category: "alfavit", kind: "letter", video: "2023/07/d.mp4", source: "/topics/alfavit/d/", meaning: "Буква Д дактильной азбуки." },
  { slug: "bukva-e", title: "Е", category: "alfavit", kind: "letter", video: "2023/07/e.mp4", source: "/topics/alfavit/e/", meaning: "Буква Е дактильной азбуки." },
  { slug: "bukva-yo", title: "Ё", category: "alfavit", kind: "letter", meaning: "Буква Ё дактильной азбуки." },
  { slug: "bukva-zh", title: "Ж", category: "alfavit", kind: "letter", video: "2023/07/zh.mp4", source: "/topics/alfavit/zh/", meaning: "Буква Ж дактильной азбуки." },
  { slug: "bukva-z", title: "З", category: "alfavit", kind: "letter", video: "2023/07/z.mp4", source: "/topics/alfavit/z/", meaning: "Буква З дактильной азбуки." },
  { slug: "bukva-i", title: "И", category: "alfavit", kind: "letter", video: "2023/07/i.mp4", source: "/topics/alfavit/i/", meaning: "Буква И дактильной азбуки." },
  { slug: "bukva-j", title: "Й", category: "alfavit", kind: "letter", video: "2023/07/iy.mp4", source: "/topics/alfavit/iy/", meaning: "Буква Й дактильной азбуки." },
  { slug: "bukva-k", title: "К", category: "alfavit", kind: "letter", video: "2023/07/k.mp4", source: "/topics/alfavit/k/", meaning: "Буква К дактильной азбуки." },
  { slug: "bukva-l", title: "Л", category: "alfavit", kind: "letter", video: "2023/07/l.mp4", source: "/topics/alfavit/l/", meaning: "Буква Л дактильной азбуки." },
  { slug: "bukva-m", title: "М", category: "alfavit", kind: "letter", video: "2023/07/m.mp4", source: "/topics/alfavit/m/", meaning: "Буква М дактильной азбуки." },
  { slug: "bukva-n", title: "Н", category: "alfavit", kind: "letter", video: "2023/07/n.mp4", source: "/topics/alfavit/n/", meaning: "Буква Н дактильной азбуки." },
  { slug: "bukva-o", title: "О", category: "alfavit", kind: "letter", video: "2023/07/o.mp4", source: "/topics/alfavit/o/", meaning: "Буква О дактильной азбуки." },
  { slug: "bukva-p", title: "П", category: "alfavit", kind: "letter", video: "2023/07/p.mp4", source: "/topics/alfavit/p/", meaning: "Буква П дактильной азбуки." },
  { slug: "bukva-r", title: "Р", category: "alfavit", kind: "letter", video: "2023/07/r.mp4", source: "/topics/alfavit/r/", meaning: "Буква Р дактильной азбуки." },
  { slug: "bukva-s", title: "С", category: "alfavit", kind: "letter", video: "2023/07/s.mp4", source: "/topics/alfavit/s/", meaning: "Буква С дактильной азбуки." },
  { slug: "bukva-t", title: "Т", category: "alfavit", kind: "letter", video: "2023/07/t.mp4", source: "/topics/alfavit/t/", meaning: "Буква Т дактильной азбуки." },
  { slug: "bukva-u", title: "У", category: "alfavit", kind: "letter", video: "2023/07/u.mp4", source: "/topics/alfavit/u/", meaning: "Буква У дактильной азбуки." },
  { slug: "bukva-f", title: "Ф", category: "alfavit", kind: "letter", video: "2023/07/f.mp4", source: "/topics/alfavit/f/", meaning: "Буква Ф дактильной азбуки." },
  { slug: "bukva-h", title: "Х", category: "alfavit", kind: "letter", video: "2023/07/h.mp4", source: "/topics/alfavit/h/", meaning: "Буква Х дактильной азбуки." },
  { slug: "bukva-c", title: "Ц", category: "alfavit", kind: "letter", video: "2023/07/c.mp4", source: "/topics/alfavit/c/", meaning: "Буква Ц дактильной азбуки." },
  { slug: "bukva-ch", title: "Ч", category: "alfavit", kind: "letter", video: "2023/07/ch.mp4", source: "/topics/alfavit/ch/", meaning: "Буква Ч дактильной азбуки." },
  { slug: "bukva-sh", title: "Ш", category: "alfavit", kind: "letter", video: "2023/07/sh.mp4", source: "/topics/alfavit/sh/", meaning: "Буква Ш дактильной азбуки." },
  { slug: "bukva-shch", title: "Щ", category: "alfavit", kind: "letter", video: "2023/07/shch.mp4", source: "/topics/alfavit/shch/", meaning: "Буква Щ дактильной азбуки." },
  { slug: "bukva-tverdyj-znak", title: "Ъ", category: "alfavit", kind: "letter", video: "2023/07/j.mp4", source: "/topics/alfavit/j/", meaning: "Буква Ъ дактильной азбуки." },
  { slug: "bukva-y", title: "Ы", category: "alfavit", kind: "letter", video: "2023/07/yu.mp4", source: "/topics/alfavit/yu/", meaning: "Буква Ы дактильной азбуки." },
  { slug: "bukva-myagkij-znak", title: "Ь", category: "alfavit", kind: "letter", video: "2023/07/_.mp4", source: "/topics/alfavit/_/", meaning: "Буква Ь дактильной азбуки." },
  { slug: "bukva-eh", title: "Э", category: "alfavit", kind: "letter", video: "2023/07/ae.mp4", source: "/topics/alfavit/ae/", meaning: "Буква Э дактильной азбуки." },
  { slug: "bukva-yu", title: "Ю", category: "alfavit", kind: "letter", video: "2023/07/y.mp4", source: "/topics/alfavit/y/", meaning: "Буква Ю дактильной азбуки." },
  { slug: "bukva-ya", title: "Я", category: "alfavit", kind: "letter", video: "2023/07/ya.mp4", source: "/topics/alfavit/ya/", meaning: "Буква Я дактильной азбуки." },
];

export const alphabetTopic = {
  slug: "alfavit", title: "Алфавит", description: "Дактильная азбука: 33 буквы, по группам.", status: "open", direction: "alphabet",
} as const;

export const alphabetLessons = [
  { slug: "alfavit-a-e", topic: "alfavit", title: "А — Е", summary: "Буквы А, Б, В, Г, Д, Е.", kind: "lesson",
    signs: ["bukva-a", "bukva-b", "bukva-v", "bukva-g", "bukva-d", "bukva-e"] },
  { slug: "alfavit-yo-j", topic: "alfavit", title: "Ё — Й", summary: "Буквы Ё, Ж, З, И, Й.", kind: "lesson",
    signs: ["bukva-yo", "bukva-zh", "bukva-z", "bukva-i", "bukva-j"] },
  { slug: "alfavit-k-o", topic: "alfavit", title: "К — О", summary: "Буквы К, Л, М, Н, О.", kind: "lesson",
    signs: ["bukva-k", "bukva-l", "bukva-m", "bukva-n", "bukva-o"] },
  { slug: "alfavit-p-u", topic: "alfavit", title: "П — У", summary: "Буквы П, Р, С, Т, У.", kind: "lesson",
    signs: ["bukva-p", "bukva-r", "bukva-s", "bukva-t", "bukva-u"] },
  { slug: "alfavit-f-sh", topic: "alfavit", title: "Ф — Ш", summary: "Буквы Ф, Х, Ц, Ч, Ш.", kind: "lesson",
    signs: ["bukva-f", "bukva-h", "bukva-c", "bukva-ch", "bukva-sh"] },
  { slug: "alfavit-shch-ya", topic: "alfavit", title: "Щ — Я", summary: "Буквы Щ, Ъ, Ы, Ь, Э, Ю, Я.", kind: "lesson",
    signs: ["bukva-shch", "bukva-tverdyj-znak", "bukva-y", "bukva-myagkij-znak", "bukva-eh", "bukva-yu", "bukva-ya"] },
];
