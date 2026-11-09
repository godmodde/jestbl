import { expect, test, type Page } from "@playwright/test";

// Сценарии из ТЗ, п. 32: человек без подсказок должен суметь всё это сделать.

// Плашку о cookie человек закрывает сам; в сценариях она лишь перекрывала бы кнопки на телефоне.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("vidno-cookie-ok", "1"));
});

// Сохранения идут очередью — ждём ответ именно на нужный шаг, а не на любой предыдущий.
const progressSaved = (page: Page, step: number) =>
  page.waitForResponse((r) => r.url().includes("/progress") && r.ok() && r.request().postDataJSON()?.step === step);

test("первый урок: найти, пересмотреть видео, разобрать, ответить, исправить ошибку, продолжить с места", async ({ page }) => {
  // 1. Найти и открыть первый урок
  await page.goto("/");
  await page.getByRole("link", { name: /Начать первый урок/ }).first().click();
  await expect(page).toHaveURL(/\/learn\/zdorovaemsya$/);
  await expect(page.getByRole("heading", { level: 1, name: "Здороваемся" })).toBeVisible();

  // 2. Понять, как пересмотреть видео
  await expect(page.getByRole("heading", { name: "Посмотрите жест «Здравствуй»" })).toBeVisible();
  await page.getByRole("button", { name: "Повторить с начала" }).click();
  await page.getByRole("button", { name: "0,5×" }).click();
  await expect(page.getByRole("button", { name: "0,5×" })).toHaveAttribute("aria-pressed", "true");

  // 3. Разобраться в карточке
  await page.getByRole("button", { name: /Разобрать жест/ }).click();
  await expect(page.getByText("Что означает", { exact: true })).toBeVisible();
  // Карточку урока можно сохранить в избранное (ТЗ, п. 18) — и состояние не теряется при возврате к шагу
  await page.getByRole("button", { name: "В избранное" }).click();
  await expect(page.getByRole("button", { name: "В избранном" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Назад" }).click();
  await page.getByRole("button", { name: /Разобрать жест/ }).click();
  await expect(page.getByRole("button", { name: "В избранном" })).toHaveAttribute("aria-pressed", "true");

  // 4–5. Выполнить упражнение, понять результат и исправить ошибку
  await page.getByRole("button", { name: /Проверить себя/ }).click();
  await expect(page.getByRole("heading", { name: "Что означает этот жест?" })).toBeVisible();
  const options = page.getByRole("group", { name: "Варианты ответа" }).getByRole("button");
  await options.filter({ hasNotText: "Здравствуй" }).first().click();
  await expect(page.getByText("Пока не совсем. Посмотрите ещё раз на движение.")).toBeVisible();
  await page.getByRole("button", { name: "Попробовать ещё раз" }).click();
  await options.filter({ hasText: "Здравствуй" }).click();
  await expect(page.getByText("Верно.")).toBeVisible();
  const saved = progressSaved(page, 3);
  await page.getByRole("button", { name: "Дальше" }).click();
  await saved;

  // 9. Продолжить обучение с того места, где остановились
  await expect(page.getByRole("heading", { name: "Посмотрите жест «До свидания»" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Посмотрите жест «До свидания»" })).toBeVisible();
  await page.goto("/learn");
  await expect(page.getByRole("heading", { level: 1, name: /Продолжить: Здороваемся/ })).toBeVisible();
});

test("избранное, поиск в словаре и возвращение через повторение", async ({ page }) => {
  await page.goto("/dictionary");
  await page.getByLabel("Найти жест").fill("спасибо");
  await page.getByLabel("Найти жест").press("Enter");
  await expect(page).toHaveURL(/q=/);
  await page.getByRole("link", { name: /^Спасибо/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Спасибо" })).toBeVisible();

  // 6. Добавить жест в избранное (и в повторение)
  let done = page.waitForResponse((r) => r.url().endsWith("/favorite") && r.ok());
  await page.getByRole("button", { name: "В избранное" }).click();
  await done;
  await expect(page.getByRole("button", { name: "В избранном" })).toHaveAttribute("aria-pressed", "true");
  done = page.waitForResponse((r) => r.url().endsWith("/review") && r.ok());
  await page.getByRole("button", { name: "В повторение" }).click();
  await done;

  // 7. Найти его в словаре
  await page.goto("/dictionary?tab=favorites");
  await expect(page.getByRole("link", { name: /^Спасибо/ })).toBeVisible();

  // 8. Вернуться к нему через повторение
  await page.goto("/review");
  await expect(page.getByRole("heading", { level: 1, name: "1 жест" })).toBeVisible();
  await page.getByRole("button", { name: /Начать повторение/ }).click();
  await page.getByRole("button", { name: "Показать ответ" }).click();
  await expect(page.getByText("Спасибо", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Знаю" }).click();
  await expect(page.getByRole("heading", { name: "Повторение закончено" })).toBeVisible();
});

test("урок целиком: все шаги до «Урок пройден», жесты попадают в изученные", async ({ page }) => {
  await page.goto("/learn/zdorovaemsya");
  // Завершение урока сохраняется в очереди — ждём именно его, а не любой шаг.
  const completed = page.waitForResponse((r) => r.url().includes("/progress") && r.ok() && r.request().postDataJSON()?.completed === true, { timeout: 60_000 });
  let current = "";
  for (let i = 0; i < 60; i++) {
    if (await page.getByRole("heading", { name: "Урок пройден" }).isVisible()) break;
    const watch = page.getByRole("heading", { name: /^Посмотрите жест «/ });
    const find = page.getByRole("heading", { name: /^Найдите жест «/ });
    if (await watch.isVisible()) {
      current = (await watch.textContent())!.match(/«(.+)»/)![1];
      await page.getByRole("button", { name: /Разобрать жест/ }).click();
    } else if (await page.getByRole("button", { name: /Проверить себя/ }).isVisible()) {
      await page.getByRole("button", { name: /Проверить себя/ }).click();
    } else if (await page.getByRole("group", { name: "Варианты ответа" }).isVisible()) {
      await page.getByRole("group", { name: "Варианты ответа" }).getByRole("button", { name: current, exact: true }).click();
      await page.getByRole("button", { name: "Дальше" }).click();
    } else if (await find.isVisible()) {
      for (const n of [1, 2, 3]) {
        await page.getByRole("button", { name: `Вариант ${n}`, exact: true }).click();
        if (await page.getByRole("button", { name: "Дальше" }).isVisible()) break;
        await page.getByRole("button", { name: "Попробовать ещё раз" }).click();
      }
      await page.getByRole("button", { name: "Дальше" }).click();
    } else if (await page.getByRole("button", { name: "Показать ответ" }).isVisible()) {
      await page.getByRole("button", { name: "Показать ответ" }).click();
      await page.getByRole("button", { name: "Почти запомнил" }).click();
    } else {
      await page.waitForTimeout(200);
    }
  }
  await expect(page.getByRole("heading", { name: "Урок пройден" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Следующий урок: Знакомимся/ })).toBeVisible();
  await completed;

  await page.goto("/dictionary?tab=learned");
  for (const title of ["Здравствуй", "До свидания", "Спасибо", "Пожалуйста", "Извиняться"]) {
    await expect(page.getByRole("link", { name: new RegExp(`^${title}`) })).toBeVisible();
  }
  await page.goto("/learn");
  await expect(page.getByRole("heading", { level: 1, name: /Продолжить: Знакомимся/ })).toBeVisible();
});

test("плашка о cookie видна при первом визите и закрывается", async ({ browser }) => {
  const page = await browser.newPage({ ...test.info().project.use });
  await page.goto("/");
  await expect(page.getByRole("region", { name: "Cookie" })).toBeVisible();
  await page.getByRole("button", { name: "Понятно" }).click();
  await expect(page.getByRole("region", { name: "Cookie" })).toBeHidden();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Начните с первого жеста" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Cookie" })).toBeHidden();
  await page.close();
});

// Новое ТЗ (2026-10-10), п. 5 и 11: экзамен по категории, детская игра, буква алфавита.

test("экзамен по категории: случайные вопросы, итог с баллом, ошибки уходят в повторение", async ({ page }) => {
  await page.goto("/adults/semya");
  await page.getByRole("link", { name: "Экзамен" }).click();
  await expect(page.getByText(/Вопрос 1 из \d+/)).toBeVisible();
  const saved = page.waitForResponse((r) => r.url().endsWith("/api/v1/exams") && r.ok());
  for (let i = 0; i < 20; i++) {
    if (await page.getByText(/из \d+ верно/).isVisible()) break;
    const match = page.getByRole("radiogroup");
    if (await match.first().isVisible()) {
      for (const group of await match.all()) await group.getByRole("radio").first().click();
    } else if (await page.getByRole("group", { name: "Варианты ответа" }).isVisible()) {
      await page.getByRole("group", { name: "Варианты ответа" }).getByRole("button").first().click();
    } else {
      await page.getByRole("button", { name: "Вариант 1", exact: true }).click();
    }
    await page.getByRole("button", { name: /Дальше|Завершить/ }).click();
  }
  await expect(page.getByText(/из \d+ верно/)).toBeVisible();
  await saved;
  await expect(page.getByRole("heading", { name: /Стоит повторить|Можно двигаться дальше|Категория освоена/ })).toBeVisible();
  await page.goto("/progress");
  await expect(page.locator("dl").getByRole("link", { name: "Семья" })).toBeVisible();
});

test("детский мир: игра «Найди жест» дарит наклейку и открывает следующую игру", async ({ page }) => {
  await page.goto("/kids");
  await expect(page.getByRole("heading", { level: 1, name: "Семья" })).toBeVisible();
  await page.getByRole("link", { name: /Играть: Найди жест/ }).click();
  const saved = page.waitForResponse((r) => r.url().endsWith("/lessons/semya-find/progress") && r.ok());
  for (let round = 0; round < 4; round++) {
    await expect(page.getByRole("list", { name: `Шаг ${round + 1} из 4` })).toBeVisible();
    for (const n of [1, 2, 3]) {
      await page.getByRole("button", { name: `Это ${n}` }).click();
      // Верный ответ — галочка вместо подписи и переход к следующему раунду; неверный — мягкая подсказка.
      if (await page.getByRole("button", { name: `Это ${n}` }).isHidden()) break;
    }
  }
  await expect(page.getByText(/Новая наклейка/)).toBeVisible();
  await saved;
  await page.getByRole("link", { name: /В альбом/ }).click();
  await expect(page.getByText("1 из 6 наклеек")).toBeVisible();
  await expect(page.getByRole("link", { name: /Играть: Собери пару/ })).toBeVisible();
});

test("алфавит: буква — видео, обведение и проверка без камеры", async ({ page }) => {
  await page.goto("/alphabet");
  await page.getByRole("link", { name: /^Буква Б,/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: /Бб/ })).toBeVisible();
  await expect(page.getByRole("img", { name: /Обведите букву Б/ })).toBeVisible();
  await page.getByRole("tab", { name: "Проверить себя" }).click();
  if (await page.getByRole("button", { name: "Без камеры" }).isVisible()) await page.getByRole("button", { name: "Без камеры" }).click();
  for (const n of [1, 2, 3]) {
    await page.getByRole("button", { name: `Вариант ${n}`, exact: true }).click();
    if (await page.getByRole("button", { name: "Дальше" }).isVisible()) break;
    await page.getByRole("button", { name: "Попробовать ещё раз" }).click();
  }
  const graded = page.waitForResponse((r) => r.url().endsWith("/bukva-b/review") && r.request().postDataJSON()?.grade === "good");
  await page.getByRole("button", { name: "Дальше" }).click();
  await graded;
  await expect(page.getByText("Буква Б изучена")).toBeVisible();
  await page.goto("/progress");
  await expect(page.getByRole("link", { name: "Б", exact: true })).toHaveAttribute("title", "Изучена");
});

