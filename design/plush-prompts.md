# Плюш для вариантов 2 «Мех» и 3 «Фетр» — промпты на генерацию

Для Nano Banana (Gemini Image) или другого генератора. Готовые файлы класть в `design/renders/` с указанными именами — встрою в сайт.
Референсы — в `design/refs/`: набросок «А» Леры (`lera-sketch-a.png`), меховые буквы (`fur-letters-*.png`), фетровые (`felt-letters.png`), плюшевые кнопки (`plush-buttons.png`).

Общие правила: без оранжевого, зелёного и ядовитых цветов. PNG с прозрачным фоном; если генератор не умеет прозрачность — ровный фон #FF00FF (уберу сам). Без надписей и водяных знаков.

Палитра «Мех»: голубой #A9CBEC, розовый #EDB8CB, сиреневый #C5B4E8, сливочный #F5DE8A, основа #F7F2EA, акцент (пятна) #2B3F94.
Палитра «Фетр»: розовый #E8B9C8, голубой #AFCBE6, сиреневый #CDB8DC, сливочный #F1DE9C, основа #F3ECE4, акцент (пятна) #5E2E6B.

## 1. Логотип «А» — `logo-a-fur.png`, `logo-a-felt.png` (1024×1024)

Приложить `lera-sketch-a.png` (форма) и `fur-letters-pav.png` / `felt-letters.png` (материал).

**Мех:**
> Create one single uppercase Cyrillic letter "А" as a soft plush toy, following the attached hand sketch for the shape: a chunky rounded A with a wide dome top, straight rounded legs, a small rounded triangular counter, two small curved horns on the top corners, and large irregular cow-like spots. Cover the letter with short dense realistic fur in off-white #F7F2EA with ink-blue spots #2B3F94; the horns are smooth matte ink-blue #2B3F94. No face, no eyes, no mouth. Front view, centered, soft diffused studio light, fully three-dimensional and touchable. Transparent background, PNG cutout, no floor, no objects. Not teal, not purple, no orange, no green, no text.

**Фетр:**
> Same letter and shape as above, but made as a soft felt pillow: short velvet pile, puffy inflated volume, a visible white dashed stitched seam along the edge. Base color #F3ECE4 with plum spots #5E2E6B, horns in plum felt #5E2E6B. No face. Front view, centered, transparent background, no orange, no green, no text.

## 2. Пушистая рамка видео — `frame-fur.png`, `frame-felt.png` (1000×1200, пропорция 5:6)

> A plush picture frame, portrait 5:6 proportion, rounded corners. Thick soft border made of short fluffy fur in powder blue #A9CBEC, fuzzy outer edge. In the middle a fully transparent empty window with rounded corners (about 80% of the width) — the window must stay empty and transparent. Front view, soft studio light, slight inner shadow where the border meets the window. Transparent background outside the frame. No text, no objects inside.

Фетр: то же, «a puffy felt cushion border in rose #E8B9C8 with a white dashed stitched seam running around the middle of the border».

## 3. Кнопки игр — `pad-fur-1…4.png`, `pad-felt-1…4.png` (512×512)

> A round plush button seen from the front, slightly domed like a small cushion, made of short dense fur in {цвет}. Empty surface, no icon, no text. Soft studio light from the top left, subtle shadow under the button only. Transparent background.

Фетр: «made of soft felt with a white dashed stitched ring near the edge». Цвета — по палитре варианта, по одной кнопке на цвет.

## 4. Буквы А–Я — `letter-fur-А.png` … (512×512)

Сначала пробные А, Б, В — после согласования остальные 30. Цвета по кругу: голубой, розовый, сиреневый, сливочный.

> Generate a photorealistic PNG image with a transparent background of a single uppercase Cyrillic letter "{буква}" made entirely of long, soft, fluffy fur in {цвет}. Highly detailed strands, realistic texture, fully three-dimensional, soft, airy and plush. Realistic studio lighting and subtle shadows inside the fur. Background completely transparent: no floor, no objects, no shadows outside the letter. Centered, close-up, sharp focus on the fur, the letter clearly readable. Aspect ratio 1:1.

Фетр: «a soft inflated felt pillow letter with a short velvet pile and a stitched seam along the edge» (как `felt-letters.png`).
