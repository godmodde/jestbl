// «Детям»: 5 открытых тем по 6 жестов и «Игрушки» (готовится). В каждой теме 6 уроков-станций с разной механикой (ТЗ, п. 5, «Направление 03»).
// Картинки — Microsoft Fluent Emoji 3D (MIT), public/pictures, источники — public/pictures/SOURCES.md.
// Мама и папа уже есть в content.mts — здесь только ссылки на их slug.
import type { SignInput } from "./content.mts";

export const kidsSigns: SignInput[] = [
  // Семья
  { slug: "babushka", title: "Бабушка", category: "semya", kind: "object", video: "2023/07/babushka.mp4", source: "/topics/otnosheniya-semya-obshhestvo/babushka/", meaning: "Бабушка — мама мамы или папы.", picture: "babushka.png" },
  { slug: "dedushka", title: "Дедушка", category: "semya", kind: "object", video: "2023/07/ded.mp4", source: "/topics/otnosheniya-semya-obshhestvo/ded/", meaning: "Дедушка — папа мамы или папы.", picture: "dedushka.png" },
  { slug: "malchik", title: "Мальчик", category: "lyudi", kind: "object", video: "2023/07/mal_chik.mp4", source: "/topics/otnosheniya-semya-obshhestvo/mal_chik/", meaning: "Мальчик.", picture: "malchik.png" },
  { slug: "devochka", title: "Девочка", category: "lyudi", kind: "object", video: "2023/07/devochka.mp4", source: "/topics/otnosheniya-semya-obshhestvo/devochka/", meaning: "Девочка.", picture: "devochka.png" },
  // Животные
  { slug: "kot", title: "Кот", category: "zhivotnye", kind: "object", video: "2023/08/Kot.mp4", source: "/topics/zhivaya-priroda/kot/", meaning: "Кот — домашнее животное.", picture: "kot.png" },
  { slug: "sobaka", title: "Собака", category: "zhivotnye", kind: "object", video: "2023/08/Sobaka.mp4", source: "/topics/zhivaya-priroda/sobaka/", meaning: "Собака — домашнее животное.", picture: "sobaka.png" },
  { slug: "ryba", title: "Рыба", category: "zhivotnye", kind: "object", video: "2023/08/Ryba.mp4", source: "/topics/zhivaya-priroda/ryba/", meaning: "Рыба.", picture: "ryba.png" },
  { slug: "ptica", title: "Птица", category: "zhivotnye", kind: "object", video: "2023/08/Ptitsa.mp4", source: "/topics/zhivaya-priroda/ptitsa/", meaning: "Птица.", picture: "ptica.png" },
  { slug: "medved", title: "Медведь", category: "zhivotnye", kind: "object", video: "2023/08/Medved.mp4", source: "/topics/zhivaya-priroda/medved/", meaning: "Медведь — дикий лесной зверь.", picture: "medved.png" },
  { slug: "lisa", title: "Лиса", category: "zhivotnye", kind: "object", video: "2023/08/Lisa.mp4", source: "/topics/zhivaya-priroda/lisa/", meaning: "Лиса — дикий лесной зверь.", picture: "lisa.png" },
  // Еда
  { slug: "yabloko", title: "Яблоко", category: "eda", kind: "object", video: "2023/08/YAbloko.mp4", source: "/topics/zhivaya-priroda/yabloko/", meaning: "Яблоко — фрукт.", picture: "yabloko.png" },
  { slug: "hleb", title: "Хлеб", category: "eda", kind: "object", video: "2023/07/hleb.mp4", source: "/topics/kuhnya-i-eda/hleb/", meaning: "Хлеб.", picture: "hleb.png" },
  { slug: "yajco", title: "Яйцо", category: "eda", kind: "object", video: "2023/07/yaiyco.mp4", source: "/topics/kuhnya-i-eda/yaiyco/", meaning: "Яйцо.", picture: "yajco.png" },
  { slug: "banan", title: "Банан", category: "eda", kind: "object", video: "2023/08/Banan.mp4", source: "/topics/zhivaya-priroda/banan/", meaning: "Банан — фрукт.", picture: "banan.png" },
  { slug: "morkov", title: "Морковь", category: "eda", kind: "object", video: "2023/08/Morkov.mp4", source: "/topics/zhivaya-priroda/morkov/", meaning: "Морковь — овощ.", picture: "morkov.png" },
  { slug: "tort", title: "Торт", category: "eda", kind: "object", video: "2023/07/tort.mp4", source: "/topics/kuhnya-i-eda/tort/", meaning: "Торт.", picture: "tort.png" },
  // Природа
  { slug: "solnce", title: "Солнце", category: "priroda", kind: "object", video: "2023/10/Solntse.mp4", source: "/topics/nezhivaya-priroda/solntse/", meaning: "Солнце.", picture: "solnce.png" },
  { slug: "luna", title: "Луна", category: "priroda", kind: "object", video: "2023/10/Luna.mp4", source: "/topics/nezhivaya-priroda/luna/", meaning: "Луна.", picture: "luna.png" },
  { slug: "dozhd", title: "Дождь", category: "priroda", kind: "object", video: "2023/10/Dozhd.mp4", source: "/topics/nezhivaya-priroda/dozhd/", meaning: "Дождь.", picture: "dozhd.png" },
  { slug: "raduga", title: "Радуга", category: "priroda", kind: "object", video: "2023/10/Raduga.mp4", source: "/topics/nezhivaya-priroda/raduga/", meaning: "Радуга.", picture: "raduga.png" },
  { slug: "derevo", title: "Дерево", category: "priroda", kind: "object", video: "2023/08/Derevo.mp4", source: "/topics/zhivaya-priroda/derevo/", meaning: "Дерево.", picture: "derevo.png" },
  { slug: "cvetok", title: "Цветок", category: "priroda", kind: "object", video: "2023/08/TSvetok.mp4", source: "/topics/zhivaya-priroda/tsvetok/", meaning: "Цветок.", picture: "cvetok.png" },
  // Транспорт
  { slug: "avtobus", title: "Автобус", category: "transport", kind: "object", video: "2023/10/Avtobus.mp4", source: "/topics/gorod-i-transport/avtobus/", meaning: "Автобус.", picture: "avtobus.png" },
  { slug: "poezd", title: "Поезд", category: "transport", kind: "object", video: "2023/10/Poezd.mp4", source: "/topics/gorod-i-transport/poezd/", meaning: "Поезд.", picture: "poezd.png" },
  { slug: "tramvaj", title: "Трамвай", category: "transport", kind: "object", video: "2023/10/Tramvaj.mp4", source: "/topics/gorod-i-transport/tramvaj/", meaning: "Трамвай.", picture: "tramvaj.png" },
  { slug: "velosiped", title: "Велосипед", category: "transport", kind: "object", video: "2023/10/Velosiped.mp4", source: "/topics/gorod-i-transport/velosiped/", meaning: "Велосипед.", picture: "velosiped.png" },
  { slug: "motocikl", title: "Мотоцикл", category: "transport", kind: "object", video: "2023/10/Mototsikl.mp4", source: "/topics/gorod-i-transport/mototsikl/", meaning: "Мотоцикл.", picture: "motocikl.png" },
  { slug: "parohod", title: "Пароход", category: "transport", kind: "object", video: "2023/10/Parohod.mp4", source: "/topics/gorod-i-transport/parohod/", meaning: "Пароход — судно с двигателем.", picture: "parohod.png" },
];

export const kidsTopics = [
  { slug: "deti-semya", title: "Семья", description: "Мама, папа, бабушка, дедушка.", status: "open", direction: "kids" },
  { slug: "deti-zhivotnye", title: "Животные", description: "Кот, собака, рыба, птица и лесные звери.", status: "open", direction: "kids" },
  { slug: "deti-eda", title: "Еда", description: "Яблоко, хлеб, яйцо и другая еда.", status: "open", direction: "kids" },
  { slug: "deti-priroda", title: "Природа", description: "Солнце, луна, дождь, радуга, дерево, цветок.", status: "open", direction: "kids" },
  { slug: "deti-transport", title: "Транспорт", description: "Автобус, поезд, трамвай и другой транспорт.", status: "open", direction: "kids" },
  { slug: "deti-igrushki", title: "Игрушки", description: "Готовится.", status: "soon", direction: "kids" },
] as const;

export const kidsLessons = [
  { slug: "semya-find", topic: "deti-semya", title: "Найди жест", summary: "Посмотри жест и выбери картинку.", kind: "find", signs: ["mama", "papa", "babushka", "dedushka", "malchik", "devochka"] },
  { slug: "semya-pair", topic: "deti-semya", title: "Собери пару", summary: "Соедини жест и картинку.", kind: "pair", signs: ["mama", "papa", "babushka", "dedushka", "malchik", "devochka"] },
  { slug: "semya-feed", topic: "deti-semya", title: "Накорми друга", summary: "Дай другу то, что он просит жестом.", kind: "feed", signs: ["mama", "papa", "babushka", "dedushka", "malchik", "devochka"] },
  { slug: "semya-route", topic: "deti-semya", title: "Пройди маршрут", summary: "Отвечай верно — и иди дальше.", kind: "route", signs: ["mama", "papa", "babushka", "dedushka", "malchik", "devochka"] },
  { slug: "semya-diff", topic: "deti-semya", title: "Найди отличие", summary: "Различи похожие жесты.", kind: "diff", signs: ["mama", "papa", "babushka", "dedushka", "malchik", "devochka"] },
  { slug: "semya-exam", topic: "deti-semya", title: "Экзамен", summary: "Покажи, что запомнил, и получи звёзды.", kind: "exam", signs: ["mama", "papa", "babushka", "dedushka", "malchik", "devochka"] },
  { slug: "zhivotnye-find", topic: "deti-zhivotnye", title: "Найди жест", summary: "Посмотри жест и выбери картинку.", kind: "find", signs: ["kot", "sobaka", "ryba", "ptica", "medved", "lisa"] },
  { slug: "zhivotnye-pair", topic: "deti-zhivotnye", title: "Собери пару", summary: "Соедини жест и картинку.", kind: "pair", signs: ["kot", "sobaka", "ryba", "ptica", "medved", "lisa"] },
  { slug: "zhivotnye-feed", topic: "deti-zhivotnye", title: "Накорми друга", summary: "Дай другу то, что он просит жестом.", kind: "feed", signs: ["kot", "sobaka", "ryba", "ptica", "medved", "lisa"] },
  { slug: "zhivotnye-route", topic: "deti-zhivotnye", title: "Пройди маршрут", summary: "Отвечай верно — и иди дальше.", kind: "route", signs: ["kot", "sobaka", "ryba", "ptica", "medved", "lisa"] },
  { slug: "zhivotnye-diff", topic: "deti-zhivotnye", title: "Найди отличие", summary: "Различи похожие жесты.", kind: "diff", signs: ["kot", "sobaka", "ryba", "ptica", "medved", "lisa"] },
  { slug: "zhivotnye-exam", topic: "deti-zhivotnye", title: "Экзамен", summary: "Покажи, что запомнил, и получи звёзды.", kind: "exam", signs: ["kot", "sobaka", "ryba", "ptica", "medved", "lisa"] },
  { slug: "eda-find", topic: "deti-eda", title: "Найди жест", summary: "Посмотри жест и выбери картинку.", kind: "find", signs: ["yabloko", "hleb", "yajco", "banan", "morkov", "tort"] },
  { slug: "eda-pair", topic: "deti-eda", title: "Собери пару", summary: "Соедини жест и картинку.", kind: "pair", signs: ["yabloko", "hleb", "yajco", "banan", "morkov", "tort"] },
  { slug: "eda-feed", topic: "deti-eda", title: "Накорми друга", summary: "Дай другу то, что он просит жестом.", kind: "feed", signs: ["yabloko", "hleb", "yajco", "banan", "morkov", "tort"] },
  { slug: "eda-route", topic: "deti-eda", title: "Пройди маршрут", summary: "Отвечай верно — и иди дальше.", kind: "route", signs: ["yabloko", "hleb", "yajco", "banan", "morkov", "tort"] },
  { slug: "eda-diff", topic: "deti-eda", title: "Найди отличие", summary: "Различи похожие жесты.", kind: "diff", signs: ["yabloko", "hleb", "yajco", "banan", "morkov", "tort"] },
  { slug: "eda-exam", topic: "deti-eda", title: "Экзамен", summary: "Покажи, что запомнил, и получи звёзды.", kind: "exam", signs: ["yabloko", "hleb", "yajco", "banan", "morkov", "tort"] },
  { slug: "priroda-find", topic: "deti-priroda", title: "Найди жест", summary: "Посмотри жест и выбери картинку.", kind: "find", signs: ["solnce", "luna", "dozhd", "raduga", "derevo", "cvetok"] },
  { slug: "priroda-pair", topic: "deti-priroda", title: "Собери пару", summary: "Соедини жест и картинку.", kind: "pair", signs: ["solnce", "luna", "dozhd", "raduga", "derevo", "cvetok"] },
  { slug: "priroda-feed", topic: "deti-priroda", title: "Накорми друга", summary: "Дай другу то, что он просит жестом.", kind: "feed", signs: ["solnce", "luna", "dozhd", "raduga", "derevo", "cvetok"] },
  { slug: "priroda-route", topic: "deti-priroda", title: "Пройди маршрут", summary: "Отвечай верно — и иди дальше.", kind: "route", signs: ["solnce", "luna", "dozhd", "raduga", "derevo", "cvetok"] },
  { slug: "priroda-diff", topic: "deti-priroda", title: "Найди отличие", summary: "Различи похожие жесты.", kind: "diff", signs: ["solnce", "luna", "dozhd", "raduga", "derevo", "cvetok"] },
  { slug: "priroda-exam", topic: "deti-priroda", title: "Экзамен", summary: "Покажи, что запомнил, и получи звёзды.", kind: "exam", signs: ["solnce", "luna", "dozhd", "raduga", "derevo", "cvetok"] },
  { slug: "transport-find", topic: "deti-transport", title: "Найди жест", summary: "Посмотри жест и выбери картинку.", kind: "find", signs: ["avtobus", "poezd", "tramvaj", "velosiped", "motocikl", "parohod"] },
  { slug: "transport-pair", topic: "deti-transport", title: "Собери пару", summary: "Соедини жест и картинку.", kind: "pair", signs: ["avtobus", "poezd", "tramvaj", "velosiped", "motocikl", "parohod"] },
  { slug: "transport-feed", topic: "deti-transport", title: "Накорми друга", summary: "Дай другу то, что он просит жестом.", kind: "feed", signs: ["avtobus", "poezd", "tramvaj", "velosiped", "motocikl", "parohod"] },
  { slug: "transport-route", topic: "deti-transport", title: "Пройди маршрут", summary: "Отвечай верно — и иди дальше.", kind: "route", signs: ["avtobus", "poezd", "tramvaj", "velosiped", "motocikl", "parohod"] },
  { slug: "transport-diff", topic: "deti-transport", title: "Найди отличие", summary: "Различи похожие жесты.", kind: "diff", signs: ["avtobus", "poezd", "tramvaj", "velosiped", "motocikl", "parohod"] },
  { slug: "transport-exam", topic: "deti-transport", title: "Экзамен", summary: "Покажи, что запомнил, и получи звёзды.", kind: "exam", signs: ["avtobus", "poezd", "tramvaj", "velosiped", "motocikl", "parohod"] },
];
