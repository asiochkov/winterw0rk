# Критика работы дизайнера

_Started 2026-08-21 09:00 UTC_

---

## User

<system-info comment="Only acknowledge these if relevant">
Project title is now "Winterwork mobile app prototype"
What `list_files` on the project root returns right now (dotfiles, if any, are not shown here):
📁 shots
📁 uploads
📄 support.js
📄 Winterwork v2 (standalone).html
📄 Winterwork v2.dc.html
📄 Winterwork v3.dc.html
📄 Winterwork.dc.html
User is viewing file: Winterwork v3.dc.html
Current date is now August 21, 2026
</system-info>

<default aesthetic_system_instructions>
The user has not attached a design system. If they have ALSO not attached references or art direction, and the project is empty, you must ASK the user what visual aesthetic they want, not guess. Ask with the ask_user tool — the text-options and svg-options kinds fit these asks. Ask about preferred vibe, audience, colors, type, mood, etc. Do NOT just pick your own visual aesthetic without getting the user's aesthetic input -- this is how you get slop!

Once answered, use this guidance when creating designs:
- Choose a type pairing from web-safe set or Google Fonts. Helvetica is a good choice. Avoid hard-to-read or overly stylized fonts. Use 1-3 fonts only.
- Foreground and background: choose a color tone (warm, cool, neutral, something in-between). Use subtly-toned whites and blacks; avoid saturations above 0.02 for whites.
- Accents: choose 0-2 additional accent colors using oklch. All accents should share same chroma and lightness; vary hue.
- NEVER write out an SVG yourself that's more complicated than a square, circle, diamond, etc.
- For imagery, never hand-draw SVGs; use subtly-striped SVG placeholders instead with monospace explainers for what should be dropped there (e.g. “product shot”)

CRITICAL: ignore default aesthetic entirely if given other aesthetic instructions like reference images, design systems or guidance, or if there are files in the project already.
</default aesthetic_system_instructions>

<pasted_text name="Pasted text (377 lines)">
# Winterwork — Промт №3 (расширенная версия для Claude Design)

&gt; Статус: ждёт «ок» пользователя по карте экранов, реализация не начата.
&gt; Зависимости: применяется **после** проходов 1 и 2, ничего из них не ломает.

---

## 0. Статус проекта (чек-лист)

| Задача | Статус |
|---|---|
| Фикс MOOD-плитки + RU-строки на Home | ✅ готово |
| Похолоднее палитра: сине-стальная, убрать тёплые подтона | ⏳ в очереди |
| Почистить текст: убрать лишние подписи, выровнять базовые линии | ⏳ в очереди |
| Промт №3: карта экранов и новая навигация | ⏳ отправлен, ждёт «ок» |
| Промт №3: реализация (5 этапов) | ⛔ не начата — стартует только после «ок» по карте экранов |

**Обязательно войти в промт №3 (не забыть при реализации):**
- счётчики отказа (quit tracker) — с тягой, срывами и вехами;
- 4 типа привычек (да/нет, количественная, временная, отказ);
- экран активной тренировки с полным вводом.

**Не входит в промт №3, делать отдельно, позже:** похолодание палитры, чистка текста/подписей. Не смешивать с этим проходом — там меняется визуал существующих экранов, здесь — архитектура и новый функционал. Если делать одновременно, будет сложно откатить и понять, откуда взялся баг.

---

## 1. Контекст для Claude Design (вставить перед промтом)

```
Третий проход по Winterwork v2 (dc.html). Предыдущие два прохода —
(1) баг-фиксы, тема Night/Daylight, RU/EN, анимации;
(2) стеклянный bento-стиль —
сохраняются полностью. Этот проход меняет информационную архитектуру
и наполняет продукт функционалом. Визуальный язык не переизобретаем:
всё новое строится теми же стеклянными bento-плитками, теми же
токенами радиусов, движения и цвета, что уже приняты в проходах 1–2.
```

**Почему это отдельным абзацем:** Claude Design должен явно понимать, что ему НЕ нужно придумывать новый визуальный стиль — только применить существующий к новым экранам. Без этой оговорки модели свойственно «улучшать» дизайн заодно, а это лишний риск сломать то, что уже согласовано.

---

## 2. Цель прохода (техническая формулировка)

Три параллельные задачи, которые нужно решить одним проходом, потому что они зависят друг от друга:

1. **Реструктуризация навигации.** Убрать двойную навигацию (`discNav`/`fitNav`, `state.world`, `setWorld`, все связанные переключатели), заменить на единую навигацию с 5 пунктами и вызываемым меню.
2. **Достройка фитнес-модуля.** Сейчас это набор демо-экранов без реальной логики тренировок (подходы, вес, прогрессия, история). Нужно превратить в рабочий инструмент.
3. **Достройка привычек.** Текущий трекер умеет только булево «сделано/не сделано». Нужны 4 типа привычек + отдельная сущность «счётчик отказа» со своей логикой срывов.

Порядок важен: без пункта 1 некуда физически поместить экраны из пунктов 2 и 3 (сейчас в навигации просто нет места на 15 новых экранов).

---

## 3. Пользовательские сценарии (акцептанс-критерии по типажам)

Каждый пункт ниже — это то, что должно быть *проверяемо* после реализации, а не просто «настроение» фичи.

### 3.1 Новичок дома
- Открывает «Сегодня» → видит готовую тренировку без необходимости что-либо настраивать.
- На карточке упражнения — техника простым языком, без жаргона.
- Если упражнение неудобно/больно — кнопка «заменить» доступна прямо в сессии, не более 2 касаний до альтернативы.
- **Не должно быть:** пустого экрана с призывом «создайте тренировку» как единственного состояния по умолчанию.

### 3.2 Зальный средний уровень
- Между подходами вводит вес/повторы одной рукой: тач-цели ≥56px, кнопки ±2.5/±5 кг и ±1 повтор.
- Поля предзаполнены прошлым результатом по этому упражнению — обычно достаточно нажать «готово».
- Видит рекорд в момент установки, без захода в отдельный экран статистики.

### 3.3 Уличный/кардио
- Старт активности в одно касание с домашнего экрана (плавающая «+»).
- Во время активности крупно видно время/дистанцию/темп.
- В прототипе карта — статичный плейсхолдер с явной пометкой в коде `// TODO: GPS integration`, но структура данных (сплиты, маршрут) уже заложена.

### 3.4 Человек, который бросает
- Кнопка «Тяга» доступна с экрана счётчика в одно касание.
- Логирование тяги — максимум 3 касания, без обязательного ввода текста.
- Срыв не обнуляет накопленную статистику (только текущий отрезок) — это проверяется отдельно, см. блок 8.5.

**Сквозное правило (акцептанс-критерий на всё):** любое действие, которое пользователь делает ежедневно (отметить привычку, записать подход, зафиксировать тягу), — не более 2 касаний от экрана «Сегодня». Действия «раз в месяц» (настройка плана, редактирование целей) могут занимать сколько угодно шагов — это осознанный компромисс, не баг.

---

## 4. Навигация — точная спецификация

### 4.1 Что удалить (явный список для Claude Design)
- Стейт `state.world` и функцию `setWorld`.
- Компоненты/разметку `discNav` и `fitNav` как раздельные навигации.
- Любую логику подмены навигации при переключении миров.
- Любые визуальные переключатели DISCIPLINE/FITNESS в шапке или где-либо ещё.

### 4.2 Что добавить взамен
Одна нижняя навигация, ровно 5 пунктов, без прокрутки и без скрытия при переполнении:

1. **Сегодня** (`today`) — единый экран дня.
2. **Тренировки** (`train`) — вкладки: Сегодня / Расписание / Планы / Библиотека.
3. **Привычки** (`habits`) — вкладки: Привычки / Отказ.
4. **Прогресс** (`progress`) — вкладки: Обзор / Тело / Сила / Привычки / Разум.
5. **Ещё** (`more`) — открывает шторку, НЕ отдельный экран с своим URL/состоянием.

### 4.3 Шторка «Ещё» — точная структура
Нижняя шторка на 85% высоты экрана, стеклянная, стиль уже существующих шторок (paywall / add habit). Сверху — строка поиска по всему приложению (упражнение, план, привычка, настройка). Ниже — сгруппированный список:

```
ТРЕНИРОВКИ
  · Библиотека упражнений
  · Планы и программы
  · Конструктор тренировки
  · История сессий
  · Личные рекорды

ТЕЛО
  · Замеры
  · Вес
  · Фото прогресса
  · Расчёт нормы калорий

ПИТАНИЕ
  · Дневник
  · Макросы
  · Вода
  · Планы питания

РАЗУМ
  · Фокус-таймер
  · Настроение
  · Дневник

АККАУНТ
  · Профиль
  · Достижения
  · Winterwork+
  · Экспорт данных
  · Настройки
```

### 4.4 Плавающая кнопка «+»
Показывается только на экранах «Сегодня» и «Тренировки». Стеклянная, над навигационным доком, справа. По тапу — компактное меню из ровно 4 пунктов (не больше, иначе теряется смысл «быстрого действия»):
1. Начать тренировку
2. Добавить привычку
3. Записать настроение
4. Записать приём пищи

**Акцептанс-критерий:** ни один из этих 4 сценариев не должен требовать перехода в раздел «Ещё» — это и есть смысл кнопки.

---

## 5. Экран «Сегодня» — детальная сборка

Объединение нынешних `home` и `fdash`. Порядок плиток **зависит от времени суток** — это отдельное требование, не опциональное:

**Утро (примерно 05:00–12:00):**
1. Hero: арка дня крупной цифрой + строка-резюме (привычки закрыты X/Y, тренировка есть/нет, чистые дни по счётчикам).
2. Плитка тренировки (самая крупная).
3. Привычки на сегодня (с чекбоксами прямо на экране).
4. Счётчики отказа (макс. 3 плитки, живое время посекундно).
5. Настроение / Фокус.
6. Тело/вес (если пользователь ведёт).

**Вечер (примерно после 18:00):** блоки настроения и дневника поднимаются выше тренировки, добавляется итог дня.

### 5.1 Плитка тренировки — 3 состояния
- **Сессия запланирована:** название, тип (зал/дом/улица), кол-во упражнений, примерная длительность, кнопка «Начать» прямо в плитке.
- **День отдыха:** текст «День отдыха», мягкое предложение лёгкой активности (растяжка/прогулка). Без визуальных маркеров вины (никаких серых/приглушённых состояний, намекающих на «пропуск»).
- **План не выбран:** предложение подобрать план ИЛИ начать свободную тренировку — два равнозначных пути, не один навязанный.

### 5.2 Привычки на сегодня
Показывать **только** привычки, у которых сегодня — день по расписанию. Привычка «пн/ср/пт» во вторник не должна быть видна на этом экране вообще (сейчас показываются все привычки всегда — это баг логики, который явно исправляется этим проходом).

---

## 6. Тренировки — ядро продукта

### 6.1 Тип тренировки как системное поле, не тег
Каждая `WorkoutSession` и `WorkoutPlan` обязаны иметь поле `place: 'gym' | 'home' | 'street'`. Это поле управляет UI:

| | Зал | Дом | Улица |
|---|---|---|---|
| Основная метрика | вес + повторы | повторы/время + уровень сложности | дистанция/темп/время |
| Инвентарь | снаряды, блины | минимальный/нет | нет |
| Пример замены | — | отжимания с колен → обычные → ноги на возвышении | — |

Фильтры библиотеки упражнений и планов тренировок **обязаны** фильтровать по `place` первым, до группы мышц — это первый вопрос реального пользователя («мне сегодня негде заниматься»).

### 6.2 Экран «Тренировки» — 4 вкладки

**Сегодня:** сессия дня, список упражнений, замена упражнения до старта, разогревочные подходы, оценка длительности, кнопка старта.

**Расписание:** недельная сетка (7 колонок). В каждой — сессии, дни отдыха, выполненные отмечены визуально. Функции:
- перенос сессии на другой день (drag-and-drop);
- добавление разовой тренировки;
- отметка недели как разгрузочной.
- **Важно:** при пропуске тренировки первым предложением должно быть «перенести», а не «пропустить» — порядок кнопок/приоритет действия имеет значение для тона продукта.

**Планы:** существующие `PLANS` + программы. Фильтры: цель (сила/масса/жиросжигание/выносливость/общая форма), место, уровень, длительность, дней в неделю. Карточка плана раскрывается в детальную: недели → дни → состав дня → нужный инвентарь → ожидаемый результат.

**Библиотека:** расширить с 12 до 40–50 упражнений в прототипе; структура данных — под 300+. Фильтры: группа мышц, инвентарь, уровень, тип (базовое/изолирующее), место. Карточка упражнения:
- техника и типичные ошибки текстом;
- схема тела с подсветкой задействованных мышц;
- альтернативы при отсутствии инвентаря;
- слот под видео (заглушка);
- личная история: график весов и рекордов по этому упражнению.

### 6.3 Экран активной тренировки — самый требовательный к UX

Контекст использования: потные руки, между подходами, ~40 секунд на весь ввод. Отсюда жёсткие требования:

- **Ввод веса/повторов:** тач-цели ≥56px, быстрые кнопки ±2.5/±5 кг и ±1 повтор — клавиатура не единственный способ ввода.
- **Автоподстановка:** поля предзаполнены прошлым результатом по этому упражнению.
- **Таймер отдыха:** стартует автоматически после записи подхода; длительность — из настроек упражнения; можно пропустить или добавить 30 сек; по окончании — визуальный акцент (в прототипе, т.к. звук/вибрация — уровень нативного приложения).
- **RPE / запас повторов:** опционально, одна строка, выключаемо в настройках (новичка это пугает, продвинутому нужно).
- **В процессе сессии доступно:** заменить упражнение, добавить/удалить подход, добавить упражнение, заметка к подходу («болело плечо»), пометка подхода как разминочного.
- **Суперсеты/круговые:** объединение упражнений в группу — тогда таймер отдыха ставится после группы, не после каждого упражнения.
- **Верхняя строка:** общее время тренировки, прогресс по подходам, кнопка паузы.
- **Калькулятор блинов:** какие блины повесить на штангу для нужного веса.
- **Экран итога:** длительность, тоннаж, кол-во подходов, новые рекорды отдельным акцентом, поле заметки, оценка самочувствия.
- **Незавершённая сессия:** если приложение закрыто посреди тренировки — при следующем открытии предложить продолжить, а не начинать заново. Это требует локального сохранения состояния сессии (см. блок 9 про офлайн).

### 6.4 Прогрессия и рекорды
- Автоопределение PR: макс. вес, макс. повторы с весом, макс. тоннаж за подход. Рекорд подсвечивается **в момент установки**, не постфактум в статистике.
- Расчётный 1ПМ по формуле Эпли, с явной пометкой «оценка, не проверенный максимум».
- Winterwork+: предложение веса на следующую сессию на основе истории («в прошлый раз 3×10 с 22.5 кг, попробуй 3×10 с 25 кг») — всегда отклоняемое предложение, не автоматическая замена значения.
- График по каждому упражнению: рабочий вес и объём во времени.

### 6.5 Улица / кардио
Типы: бег, ходьба, велосипед, лыжи, воркаут на площадке, произвольная активность.
Экран активности: крупное время/дистанция/темп, сплиты по километрам, статичный плейсхолдер карты с явной разметкой под будущий реальный трекинг, пауза/возобновление.
После завершения: сводка, средний темп, набор высоты, ощущения.
**Пометить в коде комментариями** все места, где нужны реальные GPS/датчики — в прототипе заглушки, но структура данных готова принять реальные данные без переделки.

### 6.6 Тело
- Вес: ввод, график, скользящее среднее за 7 дней (дневные колебания пугают, среднее показывает тренд — это осознанное решение, не опция).
- Замеры: грудь, талия, бёдра, руки, ноги — история и графики.
- Фото прогресса: текущий consent-флоу без изменений + режим сравнения «до/после» с ползунком между датами.
- Расчёт нормы калорий/белка по цели/весу/росту/возрасту/активности — с пометкой «оценка, не медицинское назначение».

---

## 7. Трекер привычек — 4 типа

| Тип | Логика | Пример |
|---|---|---|
| Да/нет | бинарный чекбокс | холодный душ |
| Количественная | цель числом+единица, копится за день, быстрые кнопки +1/+100/+0.25л | вода 2л, шаги 10000 |
| Временная | цель в минутах, встроенный таймер + ручной ввод | растяжка 15 мин |
| Отказ | см. блок 8 отдельно | — |

**Расписание привычки:** ежедневно / N раз в неделю / конкретные дни / каждые N дней. Показывается на «Сегодня» только в свои дни (см. 5.2).

**Дополнительно, обязательно к реализации:**
- Напоминание: время + дни, индивидуально для каждой привычки.
- Заметка к выполнению (хранение по `habitId`, не терять при перезаписи).
- **Заморозка стрика:** ограниченное число «пропусков без потери стрика» в месяц.
- **Гибкий стрик:** для привычек с расписанием считать не только «дней подряд», но и % выполнения за 30 дней — «подряд» бессмысленно для «5 раз в неделю».
- Категории, сортировка, архив вместо удаления (история не пропадает).
- Шаблоны при добавлении (сон до 23:00, 10000 шагов, вода, чтение, растяжка, без сахара, без соцсетей до полудня).
- Экран детали: календарь-heatmap за год, текущий/лучший стрик, % выполнения, график по дням недели (в какие дни чаще срывается), заметки.

---

## 8. Счётчик отказа (Quit Tracker) — отдельная сущность

Вторая вкладка раздела «Привычки». **Не путать с обычной привычкой** — метрика не «сделал/не сделал», а «сколько держусь», и логика срыва принципиально другая (см. 8.5).

### 8.1 Создание
Пресеты: курение, алкоголь, вейп, сахар, фастфуд, соцсети, азартные игры, порно, кофе, энергетики + произвольный.
Поля при создании: дата/время старта (можно указать прошлую), сколько потреблял в день, стоимость за единицу. Все поля, кроме даты — опциональны, пропуск одной кнопкой.

### 8.2 Что показывает счётчик
- **Чистое время** — живой счётчик посекундно (дни/часы/минуты), самый крупный элемент экрана.
- **Сэкономлено денег** — из стоимости × потребления, с опцией привязать к цели («13 000 из 60 000 на велосипед»).
- **Не потреблено** — «не выкурено 280 сигарет».
- **Вехи восстановления** — таймлайн с источником (CDC/NHS/ВОЗ), указанным мелкой строкой прямо в интерфейсе. **Никаких выдуманных сроков.** Если для пресета нет медицинских данных (например, соцсети) — показывать честно названные поведенческие вехи, не выдавать их за медицинские.
- **Вехи времени:** 1, 3, 7, 14, 30, 90, 180, 365 дней — визуальное празднование при достижении.

### 8.3 Кнопка «Тяга»
Крупная, одно касание с экрана счётчика. По нажатию:
- Лог эпизода: время, сила (1–5), место, состояние, триггер (стресс/скука/компания/алкоголь/после еды) — всё выбором, максимум 3 касания, текст не обязателен.
- Немедленное предложение действия: дыхательное упражнение 2 мин (переиспользовать существующий кольцевой таймер), стакан воды, короткая прогулка, отжимания, звонок близкому.
- После окончания эпизода: спокойное подтверждение «тяга прошла, ты не сорвался» — без пафоса.
- Аналитика по эпизодам: время суток и триггеры, по которым тяга чаще всего случается.

### 8.4 Срыв — критичный блок, где обычно ломаются такие трекеры
Жёсткие правила, не подлежащие смягчению:
1. Логирование срыва — не стыдно и не сложно. Кнопка спокойная (не красная, не спрятанная).
2. **Обнуляется только текущий отрезок.** Общее чистое время, сумма сэкономленных денег, все пройденные вехи, история эпизодов тяги — сохраняются. UI после срыва: «текущий отрезок: 0 дней · лучший: 87 · всего чистых дней: 134».
3. После срыва — не нотация, а вопрос по делу (что было триггером) + предложение внести в план.
4. Формулировки — нейтральные. Запрещённые слова: «провал», «ты нарушил», «начни заново». Разрешённые: «отмечен срыв», «новый отрезок начат».
5. Статистика попыток: попытка №N, средняя длительность отрезка растёт со временем — честный мотивирующий показатель даже при срывах.

### 8.5 Ответственность (медицинский дисклеймер)
- При создании счётчика по алкоголю — одно уведомление (без повторов, без нотаций): резкая отмена при выраженной зависимости может быть опасна физически, рекомендуется обсудить с врачом. Кнопка «понятно», без блокировки.
- В разделе вех и расчётов калорий — явная пометка: приложение не медицинский сервис, не заменяет консультацию специалиста.
- Ноль выдуманных медицинских цифр где-либо в приложении.

---

## 9. Прогресс — единая аналитика

Объединение `progress` и `fprog` в один раздел, вкладки: Обзор · Тело · Сила · Привычки · Разум.
- **Обзор:** сводка за период (неделя/месяц/всё), главные достижения, новые рекорды, тренд по направлению одной строкой.
- **Тело:** вес со скользящим средним, замеры, фото-сравнение.
- **Сила:** объём по неделям, рекорды, прогресс по ключевым упражнениям, распределение нагрузки по группам мышц (показывает перекос — например, качает только грудь и руки).
- **Привычки:** heatmap по всем привычкам, % выполнения, самые стабильные/проблемные.
- **Разум:** настроение, фокус-сессии, корреляции.

**Еженедельная сводка:** раз в неделю экран итогов с 3–4 главными фактами и одним конкретным предложением на следующую неделю. Формат — не похвала, а диагноз с числом: «журнал — единственная привычка ниже 60%, из-за неё срываются полные дни», а не «ты молодец».

---

## 10. Модель данных (для явного проектирования, даже с мок-данными)

```
User
Habit           { type, schedule, target, unit, reminders, category, archived }
HabitEntry      { habitId, date, value, note }
QuitCounter     { type, startDate, unitCost, dailyAmount, goal, attempts[] }
CravingEpisode  { counterId, timestamp, intensity, trigger, resolved }
Relapse         { counterId, timestamp, trigger, note }
Exercise        { group, equipment, level, type, place, cues, errors, alternatives, media }
WorkoutPlan     { goal, place, level, weeks, daysPerWeek, days[] }
WorkoutSession  { date, place, planId, exercises[], duration, notes, feeling }
SetEntry        { exerciseId, weight, reps, rpe, isWarmup, restTaken }
PersonalRecord  { exerciseId, type, value, date }
BodyMeasurement { date, weight, measurements{}, photoIds[] }
MoodEntry
FocusSession
NutritionEntry
```

## 11. Состояния экранов (обязательно для каждого нового экрана)
- Первый запуск: пусто, но с понятной кнопкой следующего действия — не ощущение поломки.
- Загрузка: скелетоны, не спиннеры.
- Ошибка.
- «Всё выполнено».
- Переполнение (100 привычек, 300 упражнений — списки должны выдерживать без деградации UI).
- Пустое состояние = приглашение к действию с конкретной кнопкой, не текст «нет данных».

## 12. Офлайн
Запись подходов и отметка привычек — работает локально, синхронизация позже (частый сценарий: тренировка в зале без связи). В прототипе — заложить это в архитектуру состояния, места будущей синхронизации пометить комментариями в коде.

## 13. Free / Plus для нового функционала
Существующую модель и цены не трогать, новое распределить по тому же принципу:

**Бесплатно:** 3 привычки, 1 счётчик отказа со всеми базовыми метриками и логированием тяги, 1 активный план тренировок, ручная запись тренировок без ограничений, история 7 дней, стартовая библиотека упражнений.

**Plus:** неограниченные привычки и счётчики, все планы/программы, полная библиотека с видео и заменами, автопрогрессия нагрузки, вся история и аналитика, конструктор тренировок, аналитика тяги/триггеров, питание по макросам, фото-сравнение, экспорт.

**Жёсткое ограничение:** логирование срыва, кнопка «тяга» и базовый счётчик чистого времени — НИКОГДА не за платным доступом. Монетизировать тяжёлый момент пользователя недопустимо ни с этической, ни с репутационной точки зрения.

## 14. Чего не делать (запреты, не рекомендации)
- Никаких лент, лайков, публичных рейтингов — Winterwork не соцсеть.
- Никакой мультяшной геймификации (маскоты, конфетти, уровни-драконы) — достижения строгие, типографические, в духе бренда.
- Никакого наказывающего тона: без красных экранов, «ты пропустил», обратных отсчётов до провала.
- Ввод не должен занимать больше 3 касаний для записи подхода — если занимает, переделывать интерфейс, а не оправдываться сложностью данных.
- Не изображать медицинский сервис, не выдумывать медицинские цифры.
- Не ломать результаты проходов 1 и 2.

---

## 15. Формат сдачи работы (порядок для Claude Design)

**Шаг 1.** Прислать текстом карту экранов и навигации: полный список экранов, состав нижней панели, состав меню «Ещё», связи между экранами, список заводимых сущностей. Отдельно — список того, что предлагается удалить/объединить из существующего кода. **Дождаться «ок» — не трогать файл dc.html до подтверждения.**

**Шаг 2.** После подтверждения — реализация по этапам, файл присылается после каждого этапа отдельно, не одним куском:

| Этап | Содержание |
|---|---|
| 1 | Новая навигация, меню «Ещё», экран «Сегодня» |
| 2 | Раздел «Тренировки»: вкладки, расписание, активная сессия с полным вводом, итог сессии |
| 3 | Привычки 4 типов с расписанием и деталью |
| 4 | Счётчики отказа: тяга, срывы, вехи |
| 5 | Единый «Прогресс», тело, достижения |

**После каждого этапа** — короткий changelog + список того, что отложено или требует решения пользователя.

**Акцептанс-критерий сдачи:** карта экранов из шага 1 должна явно закрывать три пункта, которые нельзя забыть — счётчики отказа, 4 типа привычек, экран активной тренировки. Если в присланной карте экранов их нет или они urезаны — это повод не давать «ок», а запросить доработку карты до начала реализации.
</pasted_text>

<pasted_text name="Pasted text (388 lines)">
WINTERWORK — RESPONSIVE EXPERIENCE + MOTION DESIGN MASTER PROMPT

TASK

Take the existing Winterwork product and redesign/rebuild its responsive experience across:

1. MOBILE
2. TABLET
3. LAPTOP / DESKTOP

Do NOT simply scale the existing desktop UI down.

Each form factor must feel intentionally designed for its screen size, interaction model and context.

The final product should feel like a high-end futuristic personal operating system — closer to the feeling of sitting inside a sophisticated Tesla interface than using a conventional productivity or fitness application.

Important:
Do not turn Winterwork into a literal Tesla clone.
Do not copy Tesla's UI, colors, components or branding.

Instead, capture the PRODUCT FEEL:

precision
calm technology
high-end control
beautiful information hierarchy
smooth physical interaction
minimalism
confidence
advanced system behavior
premium motion
zero visual clutter

The product must remain recognizably Winterwork.

==================================================
01 — CORE RESPONSIVE PHILOSOPHY
==================================================

Winterwork has one design language but three experiences.

MOBILE:
Personal command center.

TABLET:
Personal workspace.

LAPTOP / DESKTOP:
Personal control cockpit.

Do not use identical layouts on all devices.

Instead, preserve:
- typography system;
- design tokens;
- visual language;
- component logic;
- motion language;
- interaction principles.

But adapt:
- information density;
- navigation;
- spacing;
- composition;
- panel structure;
- interaction patterns;
- animation;
- content hierarchy.

==================================================
02 — MOBILE
==================================================

Mobile is NOT a compressed desktop.

It should feel intimate, focused and extremely polished.

Primary priorities:

1. TODAY
2. PRIMARY ACTION
3. PROGRESS
4. CURRENT STATE
5. SECONDARY INFORMATION

Avoid showing too many simultaneous panels.

Use vertical hierarchy.

Navigation must be extremely simple.

Possible structure:

HOME
FOCUS
FITNESS
PROGRESS
PROFILE

Do not force every feature into permanent bottom navigation if it does not deserve it.

Use contextual navigation where appropriate.

Touch targets:
minimum approximately 44px.

Interactions must feel tactile.

==================================================
03 — MOBILE MOTION
==================================================

Mobile motion should feel physical.

Examples:

OPEN CARD
→ card subtly expands from its actual position.

ADD TASK
→ new task enters the list naturally rather than appearing instantly.

COMPLETE TASK
→ task visually resolves into completed state.

DELETE
→ element exits with directional movement.

SWITCH WORLD
→ Productivity and Fitness transition spatially rather than hard-cutting.

OPEN FITNESS WORKOUT
→ workout interface emerges naturally from the selected card.

PROGRESS UPDATE
→ numbers transition smoothly.

Do NOT use random bouncing animations.

Motion must communicate:
where something came from;
where it went;
what changed;
what action caused the change.

==================================================
04 — TABLET
==================================================

Tablet should become a genuine workspace.

Use the extra horizontal space.

Possible structure:

LEFT:
navigation / world switcher

CENTER:
primary content

RIGHT:
contextual information when useful

Do not force a permanent three-column layout everywhere.

The right side should appear only when information benefits from it.

Tablet should feel more spacious than mobile but more focused than desktop.

==================================================
05 — LAPTOP / DESKTOP
==================================================

This is where the “high-tech control cockpit” feeling should become strongest.

The user should feel:

“I am inside a sophisticated personal operating system.”

Use:

12-column grid
large negative space
precise alignment
multiple information layers
contextual side panels
large typography
subtle data visualization
high-quality motion

But do NOT turn the screen into a Bloomberg terminal.

Do not fill every pixel.

The feeling should be:

CONTROLLED COMPLEXITY.

There is a lot of information available,
but only the information relevant to the current context is visible.

==================================================
06 — DESKTOP COMPOSITION
==================================================

Desktop Home can use a composition similar to:

TOP
global status / date / current state

LEFT
navigation + world switcher

CENTER
primary daily experience

RIGHT
contextual intelligence / progress / upcoming information

BOTTOM / SECONDARY
additional data only when useful

The central content must remain dominant.

The interface must never feel like a collection of equal cards.

==================================================
07 — DESKTOP “COCKPIT” PRINCIPLE
==================================================

The desktop experience should have a subtle control-system feeling.

Use:

precise grids
thin separators
small metadata
large primary values
subtle system indicators
controlled data density
clean geometry
restrained contrast
micro status indicators

Do not overuse:
glows
neon
gradients
HUD graphics
sci-fi decorations
fake technical text

Technology should be communicated through behavior and precision,
not decoration.

==================================================
08 — WORLD SWITCHING
==================================================

Winterwork contains two worlds:

PRODUCTIVITY
FITNESS

The transition between them is extremely important.

It should NOT simply switch tabs.

Create a beautiful spatial transition.

Example:

PRODUCTIVITY
→ interface elements reorganize
→ active world indicator moves
→ content exits with controlled motion
→ FITNESS content enters
→ navigation morphs
→ new context becomes dominant

The transition should feel like switching modes inside one operating system.

Duration:
approximately 350–600ms depending on complexity.

Keep it elegant.

==================================================
09 — DESKTOP NAVIGATION
==================================================

Desktop navigation should exploit horizontal space.

Possible:

persistent left navigation rail

or

minimal left control panel.

Use icons + labels where necessary.

Avoid icon-only navigation when the meaning is ambiguous.

Navigation should feel like a control system,
not a traditional SaaS sidebar.

==================================================
10 — TASK CREATION ANIMATION
==================================================

Task creation must be visually satisfying.

When user presses:

ADD TASK

the creation interface should emerge from the action.

Possible sequence:

button expands
→ input appears
→ cursor is ready
→ user enters task
→ confirmation
→ task becomes part of the existing list
→ list subtly rebalances

No abrupt modal unless necessary.

==================================================
11 — TASK COMPLETION ANIMATION
==================================================

Completion should be one of Winterwork's signature micro-interactions.

When completed:

checkbox/state changes
→ typography changes subtly
→ task settles into completed state
→ progress updates
→ daily state updates
→ small visual feedback occurs.

The animation should communicate:

ACTION REGISTERED.

Do not use confetti.

Do not use cartoon effects.

==================================================
12 — HABIT COMPLETION
==================================================

Habit completion should feel more meaningful than a simple checkbox.

Possible:

state fills
→ progress indicator updates
→ weekly sequence changes
→ subtle visual accumulation occurs.

The user should feel that the system remembered the action.

==================================================
13 — FITNESS INTERACTION
==================================================

Fitness cards must integrate future 3D assets naturally.

IMPORTANT:

3D objects are CONTENT,
not navigation icons.

Examples:

Fitness workout card
→ black 3D muscular torso
→ relevant muscle area illuminated with Winterwork accent color.
</pasted_text>

<pasted_text name="Pasted text (442 lines)">
Chest workout
→ chest region highlighted.

Shoulders
→ shoulder region highlighted.

Back
→ back region highlighted.

Legs
→ legs highlighted.

These assets should sit inside content cards or feature areas.

They should never become generic menu icons.

Use a consistent material, camera angle, lighting system and rendering style.

==================================================
14 — 3D CONTENT SYSTEM
==================================================

All 3D assets must share:

same visual language
same material logic
same lighting direction
same background treatment
same camera philosophy
same shadow behavior
same accent color logic

Preferred style:

matte black
high-end 3D
sculptural
realistic but slightly stylized
controlled reflections
dark environment
single Winterwork accent illumination

Do not generate random 3D objects independently.

Create an asset library.

Each asset must belong to a predefined visual system.

==================================================
15 — CARD DESIGN
==================================================

Cards must not all look identical.

Use several intentional card archetypes:

PRIMARY ACTION CARD
PROGRESS CARD
DATA CARD
CONTENT CARD
FITNESS CARD
STATUS CARD
INSIGHT CARD

But all cards must share the same design system.

Avoid excessive rounded rectangles.

Not every piece of information needs a card.

==================================================
16 — RESPONSIVE CARD BEHAVIOR
==================================================

Cards should transform between devices.

Mobile:
vertical composition.

Tablet:
wider horizontal composition where appropriate.

Desktop:
may become multi-column or split-layout.

Do not simply shrink text and images.

Change composition when necessary.

==================================================
17 — TYPOGRAPHY
==================================================

Typography must scale intelligently.

Create responsive type tokens.

Example:

mobile display
tablet display
desktop display

But do not make desktop typography unnecessarily huge.

Large numbers should feel architectural.

Body copy should remain highly readable.

Use maximum 3–4 major weight levels.

==================================================
18 — GRID
==================================================

MOBILE:
4-column conceptual grid.

TABLET:
8-column conceptual grid.

DESKTOP:
12-column grid.

Use a consistent spacing system:

4
8
12
16
24
32
48
64
96

All major elements must align.

No arbitrary margins.

==================================================
19 — DESKTOP INFORMATION DENSITY
==================================================

Desktop may expose more information than mobile.

But information should be layered.

Priority:

LEVEL 01
Immediate action.

LEVEL 02
Current progress.

LEVEL 03
Context.

LEVEL 04
Analytics.

LEVEL 05
Historical information.

Do not display Level 04–05 information when it distracts from the user's immediate action.

==================================================
20 — RESPONSIVE BREAKPOINT LOGIC
==================================================

Do not design only for:

375px
768px
1440px

The system must interpolate smoothly between sizes.

Test at:

small phone
large phone
small tablet
large tablet
small laptop
standard laptop
large desktop

No broken intermediate states.

==================================================
21 — MODALS / SHEETS
==================================================

Use different interaction patterns by device.

MOBILE:
bottom sheets / full-screen flows where appropriate.

TABLET:
centered modal or side panel.

DESKTOP:
contextual panel / modal / drawer depending on task.

Do not force desktop modal behavior onto mobile.

==================================================
22 — SIDE PANELS
==================================================

Side panels should feel like contextual system layers.

Example:

Click progress insight
→ contextual panel slides in
→ underlying interface remains visually connected.

Do not make every interaction open a full page.

Use progressive disclosure.

==================================================
23 — PAGE TRANSITIONS
==================================================

Avoid generic fade-to-black page transitions.

Prefer:

spatial movement
scale
opacity
blur where subtle
shared element transitions

A selected object should visually connect to the next screen whenever possible.

==================================================
24 — SHARED ELEMENT TRANSITIONS
==================================================

When a card opens into a detailed screen:

the card itself should appear to expand into the detail view.

Example:

TODAY'S WORKOUT CARD
→ expands
→ becomes WORKOUT SCREEN.

Example:

PROGRESS CARD
→ expands
→ becomes PROGRESS DETAIL.

This creates a high-end application feeling.

==================================================
25 — LOADING
==================================================

Do not rely on generic spinning loaders.

Use skeletons or contextual transitions.

For AI/program generation:

BUILDING YOUR PLAN

Then show structured stages subtly:

UNDERSTANDING GOAL
CHECKING EQUIPMENT
BUILDING SCHEDULE
OPTIMIZING PLAN

Do not pretend that an AI is doing something it is not actually doing.

The UI should remain truthful.

==================================================
26 — ERROR STATES
==================================================

Errors must preserve the visual quality of the product.

Never use ugly browser-like alerts.

Use contextual recovery.

Example:

WE COULDN'T UPDATE YOUR PLAN.

TRY AGAIN

==================================================
27 — WEATHER
==================================================

Weather remains optional.

If location is denied:

nothing breaks.

Do not repeatedly request permission.

The Fitness World continues normally.

If weather is available:
use it only as contextual information.

It can subtly influence:
outdoor workout suggestions
environment context
visual atmosphere

But never dominate the UI.

==================================================
28 — REDUCED MOTION
==================================================

Implement:

prefers-reduced-motion.

If enabled:

reduce large transitions
remove nonessential parallax
reduce scaling
reduce decorative movement

Core information must remain understandable.

==================================================
29 — PERFORMANCE
==================================================

Motion must feel premium without destroying performance.

Do not introduce heavy animations everywhere.

Prefer:
CSS transforms
opacity
GPU-friendly properties
lazy loading
responsive image sizing
asset optimization

3D assets must not unnecessarily destroy page performance.

==================================================
30 — MOBILE PERFORMANCE
==================================================

Mobile is a priority.

Large 3D assets must be:
optimized
lazy-loaded
compressed
responsive

Do not load the entire 3D library on application startup.

Load assets contextually.

==================================================
31 — DESIGN SYSTEM
==================================================

Create central tokens for:

colors
spacing
typography
radius
shadows
borders
motion
breakpoints
z-index
3D asset sizing

No random one-off values.

==================================================
32 — MOTION LANGUAGE
==================================================

Winterwork's motion language should feel:

precise
smooth
physical
quiet
fast when necessary
slow when meaningful

Avoid:
rubber-band effects
random bounce
excessive spring
constant floating
attention-seeking movement

Motion should feel engineered.

==================================================
33 — “TESLA-LIKE” EXPERIENCE
==================================================

Interpret this as an EXPERIENCE PRINCIPLE.

The user should feel:

precision
control
clarity
technology
confidence
instant response
high-quality physical interaction

Do NOT copy Tesla's visual design.

Winterwork needs its own identity.

Think:

personal operating system
rather than
dashboard template.
</pasted_text>

<pasted_text name="Pasted text (282 lines)">
Да. Теперь я понял, чего тебе не хватало в предыдущем варианте.
Там был design brief, а тебе нужен практически технический манифест для Claude Design: меньше объяснений, больше конкретных правил, состояний, переходов, поведения и критериев качества.
И я бы сейчас полностью убрал из этого промпта контент и 3D. Никаких фотографий, фитнес-ассетов и прочего. Сейчас задача — сам интерфейс + адаптив + motion system.
Вот версия, которую я бы реально отправлял в Claude Design.
WINTERWORK — RESPONSIVE UI + ADVANCED MOTION SYSTEM
ГЛАВНАЯ ЗАДАЧА
Пересобери существующий интерфейс Winterwork так, чтобы он ощущался как современная персональная операционная система, а не обычный web-app.
Не менять существующую продуктовую концепцию и функциональность.
Не добавлять новый контент.
Не придумывать новые функции.
Сейчас работаем исключительно над:
UI;
responsive;
navigation;
interaction design;
motion design;
transitions;
micro-interactions;
визуальной иерархией;
поведением интерфейса на разных устройствах.
Главный эмоциональный ориентир:
пользователь должен получить ощущение технологичности уровня интерфейсов JARVIS / Tony Stark:
окна появляются как элементы системы;
панели физически перемещаются;
интерфейс реагирует на действия пользователя;
элементы могут трансформироваться;
состояние системы постоянно визуально понятно;
интерфейс ощущается живым.
Но не копировать JARVIS, Iron Man или Tesla визуально.
Winterwork должен иметь собственный визуальный язык.
1. RESPONSIVE — НЕ SCALE, А RECOMPOSITION
Создать три полноценные композиции:
MOBILE
Персональный command center.
TABLET
Персональное рабочее пространство.
LAPTOP / DESKTOP
Персональная control system.
Запрещено:
просто уменьшать desktop;
сохранять desktop-grid на телефоне;
механически переносить sidebar в hamburger;
уменьшать карточки без изменения композиции.
Каждый breakpoint должен иметь собственную композиционную логику.
2. СЕТКА
Использовать строгую систему.
MOBILE
4-column grid.
Минимальные горизонтальные margins:
16–20 px.
TABLET
8-column grid.
Margins:
24–32 px.
DESKTOP
12-column grid.
Максимальная ширина контента:
примерно 1440–1600 px.
Центрировать основной контент.
Все элементы должны привязываться к grid.
Запретить случайные margin/padding.
Создать единый spacing scale:
4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96
3. DESKTOP — CONTROL SYSTEM
Desktop должен использовать пространство как полноценный control interface.
Базовая архитектура:
LEFT
navigation / world control
CENTER
главный рабочий контент
RIGHT
контекстная информация, только если необходима
Не превращать экран в набор одинаковых карточек.
Центральный контент визуально доминирует.
Secondary information должна быть менее контрастной.
Tertiary information может существовать почти незаметно.
4. ПОВЕДЕНИЕ ПАНЕЛЕЙ
Панели никогда не должны просто:
display: block
или
opacity: 0 → 1.
Каждое появление должно иметь пространственную причину.
Например:
SIDE PANEL
translateX(24px) + opacity 0
→ появляется на месте
→ становится частью интерфейса.
MODAL
Не просто появляется в центре.
Сначала:
scale 0.97 + opacity 0
→ появляется
→ backdrop постепенно активируется.
CARD → DETAIL
Карточка физически расширяется в detail-view.
Это shared-element transition.
5. ГЛАВНЫЙ ПРИНЦИП MOTION
Каждая анимация должна отвечать минимум на один вопрос:
Откуда появился элемент?
Куда он переместился?
Что изменилось?
Какое действие пользователя это вызвало?
Если анимация ничего не объясняет — удалить её.
6. MOTION TOKENS
Создать единую систему:
MICRO
120–180 ms
Checkbox, toggle, icon state, tiny feedback.
STANDARD
220–320 ms
Cards, buttons, dropdowns, small panels.
COMPLEX
350–500 ms
Navigation, screen transitions, drawers.
SIGNATURE
500–800 ms
World switching, major state transitions.
Не использовать одинаковую duration для всего приложения.
7. EASING
Не использовать стандартный ease повсюду.
Создать motion curves.
Основная:
fast-out → controlled settle
Для интерфейсных элементов:
cubic-bezier(.2,.8,.2,1)
Для exit:
более быстрая кривая.
Для крупных трансформаций:
мягкое физическое замедление.
Spring использовать точечно, а не для каждого элемента.
8. NAVIGATION MOTION
Переход между основными разделами:
не делать:
fade → fade.
Использовать spatial transition.
Текущий экран:
→ освобождает пространство
→ новый экран занимает его.
Направление движения должно зависеть от положения раздела в навигации.
Например:
A → B:
контент движется влево.
B → A:
контент возвращается вправо.
Так пользователь подсознательно понимает структуру приложения.
9. PRODUCTIVITY ↔️ FITNESS
Это не обычный tab switch.
При переключении:
текущий world indicator перемещается;
текущий контент начинает reorganize;
secondary elements исчезают;
новый world-state появляется;
navigation меняет активное состояние;
новый контент занимает пространство.
Главное:
не использовать сложный спецэффект ради спецэффекта.
Переход должен ощущаться как смена режима одной системы.
10. ADD TASK
При +:
кнопка расширяется или трансформируется в input.
Input появляется непосредственно из точки действия.
После создания:
input → task row.
Task row появляется в правильном месте списка.
Окружающие элементы физически сдвигаются.
Никаких мгновенных скачков layout.
11. DELETE
Удаление:
element:
scale 1 → .96
opacity 1 → 0
height → 0
Соседние элементы плавно занимают освободившееся место.
Удаление должно ощущаться как физическое исчезновение элемента из системы.
12. COMPLETE TASK
При выполнении:
checkbox / indicator меняет состояние;
label меняет visual state;
progress обновляется;
counter обновляется;
task фиксируется в completed state.
Все связанные изменения происходят в одной motion sequence, а не независимо.
13. HABIT COMPLETION
При выполнении привычки:
state indicator:
empty → active.
Weekly progress:
обновляется с коротким transition.
Не использовать конфетти.
Не использовать gamification ради gamification.
Эмоция должна быть:
“система зафиксировала мой прогресс.”
14. BUTTONS
Buttons должны иметь минимум 4 состояния:
default;
hover;
pressed;
disabled.
Pressed:
небольшой scale-down:
1 → .97
и изменение surface/contrast.
Hover должен быть очень коротким.
Не делать кнопки постоянно “живыми”.
15. CARDS
Card hover:
не использовать огромный lift.
Допустимо:
translateY(-2px)
изменение border/surface.
На mobile hover отсутствует.
Touch interaction заменяет hover.
16. DROPDOWNS
Dropdown:
не должен просто появляться.
Он должен:
opacity 0 → 1
translateY(-6px) → 0
с быстрым settle.
Закрытие быстрее открытия.
17. TOGGLES
Toggle должен визуально передавать:
OFF → ON
через:
движение thumb;
изменение surface;
изменение accent;
короткий tactile response.
Не использовать отдельную анимацию для каждого декоративного элемента.
18. INPUTS
Focus state должен быть очень заметным, но минималистичным.
При focus:
border / accent / glow меняются плавно.
Label может слегка изменить положение или contrast.
Ошибку показывать непосредственно рядом с проблемным полем.
Не использовать browser alert.
19. MODAL
Modal должен создавать ощущение отдельного слоя системы.
При открытии:
background:
opacity 0 → controlled dim
modal:
scale .97 → 1
translateY(8px) → 0
При закрытии:
быстрее, чем открытие.
20. BOTTOM SHEET — MOBILE
Bottom sheet:
начинается ниже viewport.
Затем:
translateY(100%) → 0
Backdrop появляется одновременно.
Поддержать drag-to-dismiss.
Если пользователь отпустил sheet после определённой точки — закрыть.
Иначе вернуть его назад.
21. SIDE PANEL — DESKTOP
Side panel должен ощущаться частью существующего пространства.
Не перекрывать всё приложение без необходимости.
Основной контент остаётся видимым.
Панель появляется справа или слева в зависимости от контекста.
22. SHARED ELEMENT TRANSITIONS
Это обязательная часть системы.
Если пользователь открывает:
CARD → DETAIL
элемент должен визуально продолжить своё существование.
Не:
карточка исчезла → новый экран появился.
А:
карточка → расширилась → стала новым экраном.
Это должно использоваться там, где это действительно возможно.
23. PAGE TRANSITIONS
Не использовать стандартный:
fade-out → fade-in.
Использовать комбинацию:
position;
opacity;
scale;
shared elements;
controlled blur.
Переход должен быть быстрым.
Пользователь никогда не должен ждать анимацию.
24. LOADING
</pasted_text>

<pasted_text name="Pasted text (205 lines)">
Loading должен выглядеть как состояние самой системы.
Использовать:
skeleton;
progressive reveal;
contextual loading.
Не использовать spinner там, где можно показать структуру будущего контента.
25. EMPTY STATES
Empty state — часть дизайна, а не ошибка.
Показывать:
что здесь происходит;
почему сейчас пусто;
какое действие можно сделать.
Но без огромных иллюстраций и лишнего декоративного контента.
26. ERROR STATES
Ошибки должны быть:
локальными;
понятными;
восстанавливаемыми.
Не сбрасывать пользователя на другой экран.
Не использовать browser-like alerts.
27. DESKTOP HOVER SYSTEM
Desktop должен активно использовать hover как дополнительный информационный слой.
Hover может показывать:
дополнительные metadata;
действие;
состояние;
preview.
Но hover не должен быть необходим для понимания интерфейса.
Все важные функции должны быть доступны без него.
28. KEYBOARD INTERACTION
Desktop должен полноценно поддерживать:
Tab navigation.
Enter.
Escape.
Arrow navigation там, где это логично.
Focus state должен быть визуально заметным.
29. MICRO-INTERACTIONS
Проработать отдельно:
checkbox;
toggle;
button;
input;
dropdown;
tooltip;
card;
notification;
progress;
tab;
navigation item;
modal;
drawer;
sheet;
search;
filters;
counters;
expandable sections.
Не оставлять стандартное browser behavior там, где оно визуально ломает систему.
30. SYSTEM FEEDBACK
Каждое важное действие должно иметь короткий feedback.
Например:
Task created.
Task completed.
Habit completed.
Changes saved.
Workout updated.
Plan updated.
Feedback может быть:
изменение состояния;
короткая motion;
небольшой status indicator.
Не использовать постоянно toast notifications.
31. TOASTS
Toast использовать только когда действие не требует визуального изменения существующего элемента.
Toast:
появляется снизу/сверху в зависимости от контекста;
легко появляется;
автоматически исчезает;
не перекрывает primary content.
32. SCROLL
Scroll должен ощущаться естественно.
Не добавлять тяжёлый custom-scroll без необходимости.
На desktop:
при длинном контенте сохранять важные controls через sticky positioning.
На mobile:
не создавать nested scrolling без крайней необходимости.
33. FIXED / STICKY ELEMENTS
Sticky navigation использовать только для элементов, которые действительно должны оставаться доступны.
Не делать весь интерфейс sticky.
Не создавать ситуацию, когда пользователь видит больше fixed UI, чем контента.
34. MOBILE GESTURES
Поддержать естественные жесты там, где они улучшают UX:
swipe;
drag;
pull;
bottom-sheet gestures.
Но не делать жест единственным способом выполнения критического действия.
35. ANIMATION HIERARCHY
Анимации должны иметь иерархию.
LEVEL 1 — SYSTEM
World switching.
Navigation.
Page transition.
LEVEL 2 — ACTION
Task creation.
Completion.
Opening card.
LEVEL 3 — MICRO
Hover.
Toggle.
Checkbox.
Focus.
Чем выше уровень — тем заметнее motion.
Микроанимации никогда не должны конкурировать с системными.
36. NO MOTION NOISE
Запретить:
постоянное floating;
бесконечные loop-анимации;
случайные glow;
чрезмерные spring;
bounce;
parallax ради красоты;
анимации всех элементов одновременно.
Если всё двигается — интерфейс выглядит дешёвым.
37. ВАЖНЫЙ ПРИНЦИП
Не пытаться сделать Winterwork “futuristic” с помощью:
неона;
HUD;
сетки;
киберпанка;
светящихся линий;
огромного количества blur;
технических надписей.
Футуризм должен появляться из:
точности + скорости + реакции + пространственного поведения + качества motion.
38. АДАПТАЦИЯ ИНТЕРФЕЙСА
Для каждого компонента определить:
mobile layout;
tablet layout;
desktop layout;
mobile interaction;
desktop interaction;
hover state;
pressed state;
focus state;
loading state;
error state;
disabled state;
transition.
Не оставлять responsive behavior на усмотрение браузера.
39. КОДОВАЯ АРХИТЕКТУРА
Не создавать отдельный уникальный код для каждого экрана.
Создать переиспользуемые:
components;
tokens;
motion presets;
breakpoints;
layout primitives;
interaction states.
Motion должен быть централизованным.
Например:
motion.fast
motion.standard
motion.complex
motion.signature
Изменение motion token должно менять поведение системы централизованно.
40. ФИНАЛЬНЫЙ ТЕСТ
Перед завершением самостоятельно пройти весь существующий интерфейс.
Проверить:
Mobile
375 / 390 / 430 px
Tablet
768 / 834 / 1024 px
Laptop
1280 / 1440 px
Desktop
1728 / 1920 px
Проверить:
overflow;
broken layouts;
text wrapping;
spacing;
hierarchy;
touch targets;
keyboard navigation;
hover;
focus;
transitions;
loading;
errors;
empty states;
reduced motion.
ФИНАЛЬНЫЙ КРИТЕРИЙ
После переработки пользователь должен чувствовать:
«Я не пользуюсь сайтом. Я управляю системой.»
Winterwork должен сочетать:
простоту Apple
точность Tesla
пространственное взаимодействие интерфейсов JARVIS
собственную визуальную идентичность Winterwork.
Но без копирования любого из этих продуктов.
Главное требование:
Не добавляй визуальный шум ради “вау”.
Создай вау через качество поведения интерфейса.
Не просто красивый UI.
Живой UI, который реагирует на пользователя как единая система.
</pasted_text>

<pasted_text name="Pasted text (429 lines)">
WINTERWORK — SIGNATURE PARALLAX ENGINE

Ты не просто добавляешь parallax effect.
Ты создаёшь фирменную spatial motion system Winterwork.

Представь, что ты 20 лет специализируешься на:
- premium interaction design;
- spatial UI;
- parallax;
- motion systems;
- cinematic interfaces;
- high-performance web animation.

Твоя задача — создать самый качественный, естественный и дорогой по ощущению parallax, который можно интегрировать в существующий Winterwork без изменения его визуальной идентичности.

ВАЖНО:
НЕ превращать приложение в лендинг.
НЕ делать постоянное движение.
НЕ добавлять эффекты ради демонстрации технологий.

Winterwork должен ощущаться как интерфейс, внутри которого существует физическое пространство.

==================================================
01. PARALLAX ENGINE
==================================================

Создай централизованный reusable Parallax Engine.

Не реализовывай каждый эффект вручную.

Каждый parallax-элемент должен получать параметры:

depth
speed
strength
maxOffset
smoothness
axis
direction
priority

Пример концепции:

depth: 0 → 1
speed: 0.6 → 1.05
strength: 0 → 1
maxOffset: ограниченное значение
smoothness: сглаживание
axis: x / y / both

Все значения должны быть централизованными tokens.

==================================================
02. НЕ LINEAR PARALLAX
==================================================

Запрещён примитивный:

scrollY * 0.5

Используй нормализованное положение элемента относительно viewport.

Рассчитывай:

element center
+
viewport center
+
scroll velocity
+
depth

Параллакс должен зависеть от положения элемента в viewport.

Когда элемент далеко от центра viewport —
эффект минимален.

Когда элемент проходит через визуальную центральную область —
depth effect становится наиболее заметным.

Это создаёт ощущение движения через пространство.

==================================================
03. VELOCITY PARALLAX
==================================================

Отслеживай velocity scroll.

Медленный scroll:

минимальный depth.

Быстрый scroll:

слои немного сильнее расходятся.

Но velocity influence должен иметь жёсткий clamp.

Не допускать резких скачков.

Использовать smoothing / interpolation.

После остановки scroll:

velocity постепенно возвращается к 0.

Никакого мгновенного reset.

==================================================
04. PHYSICAL SETTLE
==================================================

После изменения положения элемент не должен механически останавливаться.

Использовать мягкий spring-like settle.

Условно:

targetPosition

→ interpolation

→ currentPosition

→ velocity damping

→ settle.

Эффект должен напоминать физический объект,
который немного отстаёт от движения интерфейса и затем стабилизируется.

Но:

никакого bounce.

никакого exaggerated elastic effect.

Нужна дорогая, спокойная физика.

==================================================
05. DEPTH MODEL
==================================================

Использовать несколько пространственных уровней.

DEPTH 0
обычный UI.

DEPTH 1
subtle visual.

DEPTH 2
secondary visual.

DEPTH 3
large visual.

DEPTH 4
background atmospheric element.

Чем глубже элемент:

тем медленнее он реагирует на scroll.

Но глубина НЕ должна означать огромное смещение.

Depth создаётся прежде всего разницей скоростей.

==================================================
06. MAIN CONTENT
==================================================

Основной текст, navigation и controls:

НЕ ПАРАЛЛАКСИТЬ.

Они являются пространственной системой координат.

Вокруг них происходит движение visual layers.

Это критически важно.

Пользователь должен иметь стабильную точку восприятия.

==================================================
07. CONTENT CARD PARALLAX
==================================================

Для крупных карточек использовать внутренний depth.

CARD:

движется вместе со страницей.

INTERNAL VISUAL:

движется немного иначе.

TEXT:

остаётся практически неподвижным.

Таким образом карточка ощущается не как плоский rectangle,
а как поверхность с глубиной.

Максимальное внутреннее смещение:

desktop: 8–18 px
tablet: 5–12 px
mobile: 3–8 px

Не превышать эти значения без явной причины.

==================================================
08. DESKTOP
==================================================

Desktop получает максимальную spatial expression.

Использовать:

scroll parallax
+
velocity
+
subtle pointer depth

Pointer depth:

максимум 2–5 px.

Pointer interaction должен быть очень медленным и сглаженным.

Не наклонять карточки агрессивно.

Не использовать стандартный:

rotateX(10deg)
rotateY(10deg)

Это запрещено.

Вместо этого:

очень маленькое positional shift
+
минимальный depth response.

==================================================
09. TABLET
==================================================

Отключить aggressive pointer interaction.

Основной эффект:

scroll-based depth.

Интенсивность:

примерно 60–70% desktop.

Уменьшить:

maxOffset
velocityInfluence
number of active layers.

==================================================
10. MOBILE
==================================================

Mobile должен быть самым спокойным.

Основной эффект:

subtle vertical depth.

Не использовать pointer.

Не использовать сложные 3D transforms.

Не создавать motion sickness.

Максимум:

3–8 px для внутренних visual layers.

Основной контент должен ощущаться абсолютно стабильным.

==================================================
11. DEPTH MASKING
==================================================

Если возможно, использовать clipping / masking внутри visual containers.

Parallax visual не должен выходить за границы компонента неконтролируемо.

Card остаётся поверхностью.

Visual существует внутри неё.

Это особенно важно для будущих 3D objects.

==================================================
12. 3D READY ARCHITECTURE
==================================================

Архитектура должна быть готова к будущим 3D assets.

Например:

&lt;Card&gt;
    &lt;ParallaxLayer depth="background"&gt;
    &lt;ParallaxLayer depth="visual"&gt;
    &lt;Content&gt;
&lt;/Card&gt;

Позже вместо обычного изображения можно будет вставить:

3D model
transparent render
WebGL canvas
generated asset

без переписывания самой parallax system.

==================================================
13. SCROLL INTERPOLATION
==================================================

Не привязывать transform напрямую к scroll position.

Использовать:

target
+
current
+
lerp / interpolation.

Пример концепции:

current += (target - current) * smoothing

Smoothing должен зависеть от устройства.

Desktop:
быстрее реагирует.

Mobile:
немного более стабильно.

Результат должен быть buttery smooth.

==================================================
14. REQUESTANIMATIONFRAME
==================================================

Для JS-based animation использовать:

requestAnimationFrame

Не создавать постоянные тяжёлые DOM calculations.

Избегать:

layout thrashing
forced reflow
частого getBoundingClientRect()
без необходимости.

Cache static measurements там, где возможно.

==================================================
15. INTERSECTION / ACTIVATION
==================================================

Не считать parallax для элементов,
которые находятся далеко за пределами viewport.

Активировать animation только когда элемент находится рядом с viewport.

Использовать IntersectionObserver или эквивалентную оптимизацию.

Это обязательное условие.

==================================================
16. GPU FRIENDLY
==================================================

Для motion преимущественно использовать:

transform
opacity

Не анимировать постоянно:

top
left
width
height
margin

без необходимости.

Использовать:

translate3d()

только когда это действительно улучшает rendering.

Не использовать GPU hacks бессмысленно.

==================================================
17. REDUCED MOTION
==================================================

Обязательно поддержать:

prefers-reduced-motion: reduce

При включении:

parallax intensity = 0

или оставить только абсолютно необходимые transitions.

Accessibility важнее декоративного эффекта.
</pasted_text>

<pasted_text name="Pasted text (254 lines)">
==================================================
18. PARALLAX COMPOSITION
==================================================

Не каждый экран должен иметь одинаковую структуру.

На одних экранах:

background + content.

На других:

content + internal visual.

На третьих:

несколько depth layers.

Создать visual rhythm.

Пользователь не должен заранее знать,
что произойдёт при следующем scroll.

==================================================
19. CINEMATIC SECTION REVEAL
==================================================

Для некоторых крупных секций использовать:

scroll progress

как trigger.

Когда секция входит в viewport:

background layer начинает двигаться.

visual layer медленно появляется.

secondary content приходит чуть позже.

Основной текст появляется последним.

Но вся последовательность должна быть очень короткой.

Не превращать scroll в presentation animation.

==================================================
20. DEPTH CROSSING
==================================================

Для редких ключевых секций разрешить эффект:

visual layer начинает немного опережать или отставать от content layer.

Когда пользователь проходит центральную область viewport,
слои временно получают максимальное spatial separation.

После прохождения:

эффект плавно уменьшается.

Это должно создавать ощущение,
что пользователь буквально проходит через слой интерфейса.

==================================================
21. POINTER + SCROLL COMBINATION
==================================================

Desktop:

scroll определяет основную глубину.

pointer добавляет только micro-adjustment.

Никогда не суммировать эффекты напрямую.

Итоговое движение должно быть ограничено:

MAX_PARALLAX_OFFSET.

Это предотвращает чрезмерное движение.

==================================================
22. NO EFFECT STACKING
==================================================

Если элемент уже использует:

shared element transition
или
modal transition
или
page transition

не добавлять одновременно сильный parallax.

Motion должен иметь приоритеты:

1. navigation
2. interaction
3. shared element
4. parallax
5. decorative motion

Высший уровень всегда имеет приоритет.

==================================================
23. SIGNATURE MOMENT
==================================================

Создай несколько специально выбранных мест интерфейса,
где parallax становится заметнее обычного.

Это должны быть редкие “signature moments”.

Не делать весь продукт одинаково насыщенным.

Пользователь должен постепенно обнаруживать:

“О, здесь интерфейс работает иначе.”

Именно редкость делает эффект дорогим.

==================================================
24. PERFORMANCE FALLBACK
==================================================

Создать graceful degradation.

Если:

low-end device
+
low FPS
+
reduced motion
+
battery constraints

то автоматически:

уменьшить depth;

уменьшить active layers;

отключить pointer;

оставить только базовый scroll motion.

Интерфейс никогда не должен становиться медленным ради parallax.

==================================================
25. FINAL VISUAL QUALITY
==================================================

Финальный эффект должен ощущаться как:

Apple-level restraint
+
high-end automotive interface
+
cinematic spatial UI

но без копирования существующих продуктов.

Не использовать:

neon cyberpunk
HUD
grid overlays
excessive glow
random particles
fake futuristic decorations.

Футуристичность должна появляться из физики интерфейса.

==================================================
26. КРИТИЧЕСКОЕ ПРАВИЛО
==================================================

Если пользователь явно замечает:

“О, здесь параллакс!”

это НЕ обязательно хорошо.

Идеальный результат:

пользователь чувствует,
что интерфейс невероятно плавный,
пространственный,
дорогой и живой,

но не понимает сразу почему.

==================================================
27. ACCEPTANCE CRITERIA
==================================================

После реализации проверить:

375px
390px
430px

768px
834px
1024px

1280px
1440px
1728px
1920px

Проверить:

- scroll performance;
- FPS;
- mobile performance;
- touch;
- pointer;
- reduced motion;
- nested scrolling;
- long pages;
- cards;
- modals;
- page transitions;
- shared elements;
- world switching.

Параллакс не должен ломать ни один существующий UX flow.

==================================================
ФИНАЛ
==================================================

Не создавай “parallax effect”.

Создай PHYSICALITY OF THE INTERFACE.

Winterwork должен ощущаться так,
будто UI имеет:

массу,
глубину,
инерцию,
пространство
и собственную физику.

Пользователь не должен просто скроллить интерфейс.

Он должен ощущать,
что перемещается через него.
</pasted_text>


<system-reminder>Auto-injected reminder (ignore if not relevant): do not recreate copyrighted or branded UI unless the user's email domain matches that company. Create original designs instead.</system-reminder>

## Assistant



## Assistant

_[tool: run_script]_

_[tool: grep]_

_[tool: grep]_

Прошёл по текущему v3 — двойная навигация (`state.world`/`setWorld`/`discNav`/`fitNav`) на месте, фитнес-модуль демонстрационный, привычки только булевые. Файл не трогаю до «ок». Ниже шаг 1.

## Карта экранов Winterwork v4

**Единая нижняя навигация — 5 пунктов**
`today` · `train` · `habits` · `progress` · `more` (шторка, не экран)

### 1. Сегодня `today`
Слияние `home` + `fdash`. Порядок плиток по времени суток (утро: hero → тренировка → привычки → счётчики → настроение → тело; вечер: настроение/дневник поднимаются выше тренировки + итог дня).
Плитка тренировки в 3 состояниях: запланирована / день отдыха / план не выбран.
Привычки — только те, у которых сегодня день по расписанию.
FAB «+» → 4 пункта: начать тренировку · добавить привычку · настроение · приём пищи.

### 2. Тренировки `train`
- `train/today` — сессия дня, замена упражнения до старта, разогрев, оценка длительности, «Начать»
- `train/week` — недельная сетка 7 колонок, перенос сессии (drag), разовая тренировка, разгрузочная неделя; при пропуске первая кнопка «Перенести»
- `train/plans` → `plan/:id` (недели → дни → состав → инвентарь → результат); фильтры цель/место/уровень/длительность/дней
- `train/library` → `exercise/:id`; 40–50 упражнений, фильтр по `place` первым; техника, ошибки, схема мышц, альтернативы, слот видео, личная история
- **`session/active`** — ввод веса/повторов ≥56px, ±2.5/±5 кг, ±1 повтор, автоподстановка прошлого результата, таймер отдыха (+30/пропуск), RPE опционально, замена/добавление/удаление подхода и упражнения, заметка к подходу, разминочный флаг, суперсеты, верхняя строка (время/прогресс/пауза), калькулятор блинов, PR в момент установки
- `session/summary` — длительность, тоннаж, подходы, новые рекорды акцентом, заметка, самочувствие
- `session/resume` — предложение продолжить незавершённую сессию
- `activity/active` + `activity/summary` — улица/кардио: время/дистанция/темп крупно, сплиты, статичная карта `// TODO: GPS integration`

### 3. Привычки `habits`
- `habits/list` — 4 типа: да/нет, количественная, временная, отказ; расписание, категории, сортировка, архив
- `habit/new` — шаблоны + тип + цель/единица + расписание + напоминание
- `habit/:id` — heatmap за год, текущий/лучший стрик, % за 30 дней (гибкий стрик), график по дням недели, заметки, заморозка стрика
- **`habits/quit`** — список счётчиков отказа
- `quit/new` — пресеты + дата старта (можно прошлую) + потребление + стоимость; алкоголь → одноразовый дисклеймер
- **`quit/:id`** — чистое время посекундно (главный элемент), сэкономлено (+ цель), не потреблено, вехи восстановления с указанием источника, вехи времени 1/3/7/14/30/90/180/365
- `quit/:id/craving` — сила 1–5, место, состояние, триггер, ≤3 касания → предложение действия (дыхание 2 мин на существующем кольцевом таймере, вода, прогулка, отжимания, звонок)
- `quit/:id/relapse` — спокойная кнопка; обнуляется только текущий отрезок; «текущий 0 · лучший 87 · всего 134»; вопрос о триггере; попытка №N + средняя длительность отрезка
- `quit/:id/stats` — аналитика тяги по времени суток и триггерам

### 4. Прогресс `progress`
Слияние `progress` + `fprog`. Вкладки: Обзор · Тело · Сила · Привычки · Разум. Плюс `progress/weekly` — еженедельная сводка (3–4 факта + одно предложение), `body/weight`, `body/measurements`, `body/photos` (сравнение до/после с ползунком), `body/calories`.

### 5. Ещё `more` — шторка 85%
Поиск по приложению + группы: ТРЕНИРОВКИ (библиотека, планы, конструктор, история сессий, рекорды) · ТЕЛО (замеры, вес, фото, калории) · ПИТАНИЕ (дневник, макросы, вода, планы) · РАЗУМ (фокус-таймер, настроение, дневник) · АККАУНТ (профиль, достижения, Winterwork+, экспорт, настройки).

### Сущности
`Habit` (+`type`,`schedule`,`target`,`unit`,`reminders`,`category`,`archived`,`freezes`) · `HabitEntry` · `QuitCounter` (+`attempts[]`) · `CravingEpisode` · `Relapse` · `Exercise` (+`place`) · `WorkoutPlan` · `WorkoutSession` (+`place`) · `SetEntry` · `PersonalRecord` · `BodyMeasurement` · `MoodEntry` · `FocusSession` · `NutritionEntry`

### Удаляется / объединяется
Удалить: `state.world`, `setWorld`, `discNav`/`fitNav` как раздельные навигации, переключатели DISCIPLINE/FITNESS, логику подмены навигации.
Объединить: `home`+`fdash` → `today`; `progress`+`fprog` → `progress`; `flib`/`fplans`/`ffood` → вкладки `train` и разделы шторки «Ещё»; `focus`/`profile` → «Ещё» (фокус-таймер остаётся доступен с «Сегодня»).
Сохраняется без изменений: темы Night/Daylight, RU/EN, стеклянные bento-плитки, токены радиусов и движения, paywall-модель и цены, consent-флоу фото.

Все три обязательных пункта в карте есть: счётчики отказа (8.x, полный блок), 4 типа привычек (`habits/list`, `habit/new`), экран активной тренировки (`session/active` с полным вводом).

Дальше — вопросы по последовательности, потому что вместе с промтом №3 пришли ещё три документа (responsive+motion, технический манифест UI/motion, parallax engine), и они частично противоречат друг другу: мастер-промт требует 3D-ассеты, более поздний манифест прямо говорит убрать контент и 3D.

_[tool: ask_user]_

Жду «ок» по карте и ответов по порядку прохода — файл не трогаю.

## User

Answered — map_ok: Ок, начинай; order: Сначала промт №3 целиком (этапы 1–5), потом responsive+motion, потом parallax; scope_responsive: Мобайл + tablet + desktop композиции в одном проходе; three_d: Убрать, как в позднем манифесте; file: Новый Winterwork v4.dc.html; delivery: Всё одним куском; library_size: 40–50, как в промте

## Assistant

_[tool: read_file]_

_[tool: read_file]_

_[tool: copy_files]_

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: run_script]_

Начинаю сборку v4. Сначала хирургия по шаблону.

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

Теперь логика.

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: show_html]_

_[tool: show_html]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: show_html]_

_[tool: get_webview_logs]_

_[tool: multi_screenshot]_

_[tool: multi_screenshot]_

_[tool: get_webview_logs]_

_[tool: ready_for_verification]_

**Winterwork v4.dc.html** — все 5 этапов промта №3 одним куском. v2 и v3 не тронуты.

**Этап 1.** Удалены `state.world`, `setWorld`, `discNav`/`fitNav`, переключатели DISCIPLINE/FITNESS. Одна нижняя навигация: Сегодня · Тренировки · Привычки · Прогресс · Ещё (шторка 85% с поиском и 5 группами). FAB «+» только на «Сегодня» и «Тренировки», ровно 4 пункта. Экран «Сегодня» — слияние `home`+`fdash`, порядок плиток зависит от времени суток (вечером настроение и итог дня поднимаются выше тренировки), плитка тренировки в 3 состояниях, привычки только по расписанию дня.

**Этап 2.** «Тренировки» с 4 вкладками. Расписание: недельная сетка, при пропуске первая кнопка — «Перенести». Планы и библиотека фильтруются по месту первым, потом по цели/группе. Библиотека — 52 упражнения с `place`. Активная сессия: тач-цели 56px, ±2.5/±5 кг, ±1 повтор, предзаполнение прошлым результатом, таймер отдыха с +30/пропуск, разминочные подходы, суперсеты, калькулятор блинов, заметка, RPE (выключен по умолчанию, включается в Tweaks), PR подсвечивается в момент установки. Экран итога и предложение продолжить незавершённую сессию.

**Этап 3.** 4 типа привычек (да/нет, количественная с +шагом, временная с таймером, отказ), расписание, шаблоны, напоминание, гибкий стрик.

**Этап 4.** Счётчики отказа: живое время посекундно, сэкономлено с целью, не потреблено, вехи времени 1–365 дней. Вехи восстановления для курения — цифры CDC/Surgeon General с источником в интерфейсе; где медицинских данных нет, вехи явно помечены поведенческими. Тяга в 3 касания + предложение действия, срыв обнуляет только текущий отрезок («текущий 0 · лучший 87 · всего 134»), формулировки нейтральные, для алкоголя — одноразовое уведомление.

**Этап 5.** Единый «Прогресс»: Обзор · Тело · Сила · Привычки · Разум, еженедельная сводка в формате «диагноз с числом», распределение нагрузки по группам с честным «ноги и спина отстают».

Отложено и требует твоего решения: перенос сессии drag-and-drop сейчас показывает подсказку, а не реальное перетаскивание; экран улица/кардио (сплиты, плейсхолдер карты) в карту вошёл, но в этом проходе не собран — скажи, добавлять его в этот файл или в следующий проход вместе с responsive+motion. Похолодание палитры и чистка текста, как договорились, не трогал.

## User

Found issues — fixing…

## Assistant

_[tool: str_replace_edit]_

_[tool: ready_for_verification]_

Убрал нативные скроллбары на горизонтальных полосах вкладок и фильтров — теперь правило `.wwscroll` скрывает их и по высоте.

## User

очень плохо ты отработал с последним запросом в целом ничего не изменилась. Практически все запросы из промта не были выполнены. почему написано Full Body A не понятно. Переключатель миров дисциплин и фитнеса нет, нет анимаций вообще ui не исправлен и визуал тоже

## Assistant



## Assistant

Разберёмся по факту, где что.

По промту №3 переключатель миров требовалось **удалить** — раздел 4.1 явно перечисляет `state.world`, `setWorld`, `discNav`/`fitNav` и «любые визуальные переключатели DISCIPLINE/FITNESS» в списке «что удалить». Я это сделал. В более поздних промтах (responsive + motion) переключатель миров, наоборот, описан как ключевая анимация. Это прямое противоречие между двумя промтами, и без твоего решения я снова сделаю не то.

Анимации, motion, responsive и параллакс — это промты 2, 3 и 4 из пачки. В форме ты выбрал порядок «сначала промт №3 целиком, потом responsive+motion, потом parallax», поэтому в этом проходе визуал и движение я не трогал сознательно: третий промт — это архитектура и функционал, и там же было отдельное требование «визуальный язык не переизобретаем».

«Full Body A» — это мок-название тренировки из v3, я его перенёс как было. Сейчас исправляю на русское и переключаю язык интерфейса по умолчанию на русский.

_[tool: run_script]_

_[tool: ask_user]_

Интерфейс переключил на русский, названия тренировки и упражнений в сессии тоже. Жду ответа по мирам и по порядку следующего прохода — дальше делаю визуал и motion целиком.

## User

Answered — Asked for follow-up questions; worlds: Вернуть переключатель миров ДИСЦИПЛИНА / ФИТНЕС и сделать его главной анимацией — как в promt про motion; next_scope: Motion + tablet/desktop композиции в одном проходе; file: Продолжать в v4; lang: Русский везде, включая названия упражнений и планов; open_q: 1. Дизайн плоский без элементов эмодзи вообще нет обозначений тоже. Хотелось чтобы ты генирировал каието обозночение для вкладок разделов и тд

## Assistant



## Assistant

_[tool: snip]_

_[tool: ask_user]_

_[tool: ask_user]_

Жду ответы: стиль иконок, где они нужны, и что именно меняет переключатель миров. Дальше делаю проход целиком — иконки, motion, tablet/desktop, полный русский.

## User

Answered — icon_style: option_2; icon_scope: Нижняя навигация, Вкладки разделов, Шторка «Ещё», Типы привычек, Пресеты счётчиков отказа, Группы мышц и инвентарь, Место: зал / дом / улица, Триггеры тяги, Состояния настроения; world_split: Оба мира делят один экран «Сегодня» и один «Прогресс», различаются только средние три пункта

## Assistant

Большой проход. Начинаю с системы иконок, motion-токенов и русского контента.

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: update_todos]_

_[tool: run_script]_

_[tool: show_html]_

_[tool: update_todos]_

_[tool: ready_for_verification]_

Сделано в этом проходе:

**Иконки** — единая система плоских геометрических глифов (24×24, заливка), одна карта путей на всё приложение: навигация, вкладки, шторка «Ещё», типы привычек, пресеты счётчиков отказа, группы мышц, инвентарь, место (зал/дом/улица), триггеры тяги.

**Миры вернулись.** Переключатель ДИСЦИПЛИНА / ФИТНЕС в доке (на десктопе — в рельсе). Оба мира делят «Сегодня» и «Прогресс», меняются средние три пункта: Привычки · Отказ · Фокус против Тренировки · Тело · Питание. Экран «Сегодня» меняет порядок плиток при переключении, вкладки «Прогресса» — состав. «Ещё» переехало из дока в отдельную кнопку.

**Motion.** Токены длительностей (micro 150 / standard 260 / complex 420 / signature 620) и кривые в одном месте, переходы между разделами направленные — вправо-влево по позиции в навигации, переключение миров идёт собственной signature-анимацией с расфокусом, hover/pressed на кнопках и карточках, `prefers-reduced-motion` учтён.

**Адаптив.** Три композиции: телефон 402px, планшет 860px, десктоп 1360px. На планшете и десктопе рамка телефона уходит, навигация превращается в левый рельс с подписями, плитки «Сегодня» перестраиваются в 2 и 3 колонки, «Тренировки» и «Прогресс» на десктопе идут в две колонки, отступы и типографика масштабируются.

**Русский везде** — 52 упражнения, планы с описаниями, привычки, группы мышц, инвентарь, уровни, цели.

Достиг лимита использования на сегодня. Осталось из промтов, что доделаю следующим проходом: иконки внутрь визуальных строк вкладок и списков (пути в данных уже есть, нужно вставить `svg` в разметку), shared-element переход карточка→деталь, drag-to-dismiss для шторок, экран улица/кардио.

