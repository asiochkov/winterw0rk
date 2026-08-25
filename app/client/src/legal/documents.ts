/**
 * Versioned legal documents. Bumping a version re-prompts every user for consent,
 * so only bump when the substance changes, not for typo fixes.
 *
 * These are drafted to describe what this application actually does. They are not
 * a substitute for review by a qualified lawyer before you operate commercially.
 */
export const LEGAL_VERSIONS = {
  terms: '2026-08-24',
  privacy: '2026-08-24',
} as const;

export const OPERATOR = {
  productName: 'Winterwork',
  contactEmail: 'privacy@winterwork.example',
  minimumAge: 16,
} as const;

export interface LegalSection {
  heading: string;
  body: string[];
}

export interface LegalDocument {
  title: string;
  version: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

export const TERMS_EN: LegalDocument = {
  title: 'Terms of Service',
  version: LEGAL_VERSIONS.terms,
  updated: '24 August 2026',
  intro:
    'These terms govern your use of Winterwork. By creating an account you agree to them. If you do not agree, do not use the service.',
  sections: [
    {
      heading: '1. What Winterwork is',
      body: [
        'Winterwork is a personal tracking tool for habits, quitting behaviours, mood, focus sessions, training, nutrition and body measurements. It records what you enter and shows it back to you.',
        'Winterwork is not a medical device, and it does not provide medical, psychological, nutritional or professional coaching advice. Nothing in the app is a diagnosis, treatment or prescription.',
      ],
    },
    {
      heading: '2. Health and safety',
      body: [
        'Exercise, dietary change and stopping an addictive substance carry real risks. Consult a qualified professional before making significant changes, especially if you have a medical condition, are pregnant, or are dependent on alcohol or another substance where sudden cessation can be dangerous.',
        'Technique descriptions, calorie estimates, and any figures the app derives from your data are approximations for your own reference. You are responsible for how you train and what you consume.',
        'If you are in crisis or think you may harm yourself, contact your local emergency services or a crisis line. Winterwork cannot help you in an emergency.',
      ],
    },
    {
      heading: '3. Your account',
      body: [
        `You must be at least ${OPERATOR.minimumAge} years old to create an account.`,
        'You are responsible for keeping your password confidential and for activity that happens under your account. Tell us promptly if you believe your account has been accessed without your permission.',
        'Provide accurate registration details. One person, one account.',
      ],
    },
    {
      heading: '4. Your content',
      body: [
        'The data you enter remains yours. You grant us only the permission needed to store it, process it and display it back to you so the service can function.',
        'We do not sell your data, and we do not use your health or fitness data for advertising.',
      ],
    },
    {
      heading: '5. Acceptable use',
      body: [
        'Do not attempt to access other users’ accounts or data, disrupt the service, probe it for vulnerabilities without permission, scrape it at scale, or use it to break the law.',
        'We may suspend or terminate accounts that do these things.',
      ],
    },
    {
      heading: '6. Paid features',
      body: [
        'Winterwork is currently free and every feature is available to all accounts.',
        'Paid plans may be introduced later. If that happens: existing functionality that you already rely on will not be removed from the free tier without clear advance notice; pricing, billing period and cancellation terms will be shown before you are ever charged; and you will always be able to cancel and to export your data.',
      ],
    },
    {
      heading: '7. Availability and changes',
      body: [
        'The service is provided on an "as is" and "as available" basis. We do not guarantee uninterrupted operation, and we may change or discontinue features.',
        'We will give reasonable notice of material changes to these terms. Continuing to use the service after a change takes effect means you accept the revised terms.',
      ],
    },
    {
      heading: '8. Limitation of liability',
      body: [
        'To the fullest extent permitted by law, we are not liable for indirect or consequential loss, for lost data where you have not kept your own copy, or for outcomes arising from decisions you made using the app.',
        'Nothing here limits liability that cannot lawfully be limited, including for death or personal injury caused by negligence, or for fraud.',
      ],
    },
    {
      heading: '9. Ending your use',
      body: [
        'You can delete your account at any time in Settings. Deletion is immediate and removes your data as described in the Privacy Policy.',
        'We may terminate an account for a serious or repeated breach of these terms, ordinarily with notice.',
      ],
    },
    {
      heading: '10. Contact',
      body: [`Questions about these terms: ${OPERATOR.contactEmail}`],
    },
  ],
};

export const PRIVACY_EN: LegalDocument = {
  title: 'Privacy Policy',
  version: LEGAL_VERSIONS.privacy,
  updated: '24 August 2026',
  intro:
    'This policy explains what Winterwork collects, why, how long it is kept, and the control you have over it. Much of what the app records is health-related and therefore sensitive, so it is treated accordingly.',
  sections: [
    {
      heading: '1. What we collect',
      body: [
        'Account data: your email address, a display name if you provide one, and a securely hashed password. We never store your password in readable form.',
        'Data you enter: habits and completions, quit counters including craving and relapse entries, mood ratings and notes, focus sessions, workouts and logged sets, body weight and measurements, food and water entries, planner tasks, and step counts.',
        'Location data, only if you choose it: when you record an outdoor activity and grant location permission, the route coordinates, altitude and timing are stored so distance, pace, splits and elevation can be calculated. If you decline the permission, no location data is collected and you can enter distance manually instead.',
        'Motion data, only if you choose it: step counting reads your device motion sensor in your browser to count steps. Raw sensor readings are processed on your device and are not transmitted; only the resulting step count is stored.',
        'Technical data: a session cookie that keeps you signed in, and ordinary server logs.',
      ],
    },
    {
      heading: '2. Why we process it',
      body: [
        'To provide the service you asked for: storing your entries and showing your history, streaks, trends and summaries.',
        'To keep your account secure and to prevent abuse.',
        'For health-related data, our legal basis is your explicit consent, given when you create an account and again when you grant optional device permissions. You may withdraw consent at any time by deleting the relevant entries or your whole account.',
      ],
    },
    {
      heading: '3. What we do not do',
      body: [
        'We do not sell your data or share it with data brokers.',
        'We do not use your health, fitness or location data for advertising or profiling.',
        'We do not run third-party analytics, advertising or social tracking scripts.',
      ],
    },
    {
      heading: '4. Cookies and local storage',
      body: [
        'Winterwork sets one strictly necessary cookie, which keeps you signed in. Without it the service cannot work, so it is not subject to an opt-in.',
        'Your browser also stores your language choice locally on your device. Nothing else is stored, and there are no advertising or analytics cookies.',
      ],
    },
    {
      heading: '5. Who can see your data',
      body: [
        'Your entries are visible only to you when signed in. There are no social or sharing features.',
        'Service providers used to host and run the application may process data on our behalf under contract, restricted to that purpose.',
        'We may disclose data where legally required, and will resist overbroad requests where we reasonably can.',
      ],
    },
    {
      heading: '6. How long it is kept',
      body: [
        'Your data is kept while your account is open, because the point of the product is long-term history.',
        'When you delete your account, your records are removed from the live database immediately. Encrypted backups may retain copies for a short rolling period before being overwritten.',
      ],
    },
    {
      heading: '7. Your rights',
      body: [
        'Access and portability: export a complete machine-readable copy of everything associated with your account from Settings, at any time, without asking us.',
        'Erasure: delete your account and its data from Settings, at any time.',
        'Rectification: correct any entry directly in the app.',
        'Withdraw consent: revoke location or motion permission in your browser at any time; the rest of the app continues to work.',
        'If you are in the UK, EU or another region with equivalent law, you also have the right to complain to your data protection authority.',
      ],
    },
    {
      heading: '8. Security',
      body: [
        'Passwords are hashed with bcrypt. Session cookies are HTTP-only, and are marked secure in production. Access to your records is scoped to your account on every request.',
        'No system is perfectly secure. If a breach affects your data, we will notify affected users and the relevant authority as required by law.',
      ],
    },
    {
      heading: '9. Children',
      body: [
        `Winterwork is not intended for anyone under ${OPERATOR.minimumAge}. We do not knowingly collect data from children. If you believe a child has created an account, contact us and we will remove it.`,
      ],
    },
    {
      heading: '10. Changes and contact',
      body: [
        'If this policy changes materially, you will be asked to review it the next time you sign in.',
        `Questions, or to exercise a right that is not self-service: ${OPERATOR.contactEmail}`,
      ],
    },
  ],
};

export const TERMS_RU: LegalDocument = {
  title: 'Пользовательское соглашение',
  version: LEGAL_VERSIONS.terms,
  updated: '24 августа 2026',
  intro:
    'Эти условия регулируют использование Winterwork. Создавая аккаунт, вы соглашаетесь с ними. Если вы не согласны — не пользуйтесь сервисом.',
  sections: [
    {
      heading: '1. Что такое Winterwork',
      body: [
        'Winterwork — инструмент личного учёта: привычки, отказ от вредных привычек, настроение, фокус-сессии, тренировки, питание и замеры тела. Он сохраняет то, что вы вводите, и показывает это вам.',
        'Winterwork не является медицинским изделием и не даёт медицинских, психологических, диетологических или тренерских рекомендаций. Ничто в приложении не является диагнозом, лечением или назначением.',
      ],
    },
    {
      heading: '2. Здоровье и безопасность',
      body: [
        'Физические нагрузки, смена питания и отказ от зависимости связаны с реальными рисками. Проконсультируйтесь со специалистом перед серьёзными изменениями — особенно при наличии заболеваний, беременности или зависимости от алкоголя либо другого вещества, где резкий отказ может быть опасен.',
        'Описания техники, оценки калорий и любые расчётные показатели — приблизительные и приведены для вашего сведения. Ответственность за то, как вы тренируетесь и что едите, лежит на вас.',
        'Если вы в кризисе или думаете о причинении себе вреда — обратитесь в экстренные службы или на кризисную линию. Winterwork не поможет в экстренной ситуации.',
      ],
    },
    {
      heading: '3. Ваш аккаунт',
      body: [
        `Для создания аккаунта вам должно быть не менее ${OPERATOR.minimumAge} лет.`,
        'Вы отвечаете за сохранность пароля и за действия, совершённые под вашим аккаунтом. Сообщите нам, если считаете, что доступ получен без вашего согласия.',
        'Указывайте достоверные данные при регистрации. Один человек — один аккаунт.',
      ],
    },
    {
      heading: '4. Ваши данные',
      body: [
        'Введённые вами данные остаются вашими. Вы даёте нам только те права, которые нужны для их хранения, обработки и отображения вам, чтобы сервис работал.',
        'Мы не продаём ваши данные и не используем данные о здоровье и тренировках для рекламы.',
      ],
    },
    {
      heading: '5. Допустимое использование',
      body: [
        'Запрещено пытаться получить доступ к чужим аккаунтам и данным, нарушать работу сервиса, искать уязвимости без разрешения, массово выгружать данные и использовать сервис для нарушения закона.',
        'Мы вправе приостановить или удалить аккаунты, нарушающие эти правила.',
      ],
    },
    {
      heading: '6. Платные функции',
      body: [
        'Сейчас Winterwork бесплатен, все функции доступны всем аккаунтам.',
        'Платные тарифы могут появиться позже. При этом: функциональность, которой вы уже пользуетесь, не будет убрана из бесплатного тарифа без заблаговременного уведомления; цена, период оплаты и условия отмены будут показаны до любого списания; вы всегда сможете отменить подписку и выгрузить свои данные.',
      ],
    },
    {
      heading: '7. Доступность и изменения',
      body: [
        'Сервис предоставляется «как есть» и «по мере доступности». Мы не гарантируем бесперебойную работу и можем изменять или прекращать функции.',
        'О существенных изменениях условий мы уведомим заранее. Продолжение использования после вступления изменений в силу означает согласие с ними.',
      ],
    },
    {
      heading: '8. Ограничение ответственности',
      body: [
        'В максимально допустимой законом степени мы не несём ответственности за косвенные убытки, за потерю данных при отсутствии вашей собственной копии и за последствия решений, принятых вами на основе приложения.',
        'Ничто здесь не ограничивает ответственность, которая не может быть ограничена по закону, включая вред жизни и здоровью по неосторожности и мошенничество.',
      ],
    },
    {
      heading: '9. Прекращение использования',
      body: [
        'Вы можете удалить аккаунт в любой момент в Настройках. Удаление происходит сразу и убирает ваши данные так, как описано в Политике конфиденциальности.',
        'Мы можем закрыть аккаунт за серьёзное или повторное нарушение условий, как правило — с уведомлением.',
      ],
    },
    {
      heading: '10. Контакты',
      body: [`Вопросы по условиям: ${OPERATOR.contactEmail}`],
    },
  ],
};

export const PRIVACY_RU: LegalDocument = {
  title: 'Политика конфиденциальности',
  version: LEGAL_VERSIONS.privacy,
  updated: '24 августа 2026',
  intro:
    'Политика объясняет, что Winterwork собирает, зачем, сколько хранит и как вы этим управляете. Многое из того, что записывает приложение, относится к здоровью и является чувствительными данными — и обрабатывается соответственно.',
  sections: [
    {
      heading: '1. Что мы собираем',
      body: [
        'Данные аккаунта: email, отображаемое имя (если указали) и надёжно хешированный пароль. Пароль в открытом виде не хранится никогда.',
        'Ваши записи: привычки и отметки, счётчики отказа с эпизодами тяги и срывами, оценки настроения и заметки, фокус-сессии, тренировки и подходы, вес и замеры тела, приёмы пищи и вода, задачи планера, шаги.',
        'Геоданные — только по вашему выбору: при записи уличной активности с разрешением на геолокацию сохраняются координаты маршрута, высота и тайминг, чтобы рассчитать дистанцию, темп, отрезки и набор высоты. Если разрешение не дано, геоданные не собираются, а дистанцию можно ввести вручную.',
        'Данные о движении — только по вашему выбору: подсчёт шагов использует датчик движения устройства в браузере. Сырые показания обрабатываются на устройстве и не передаются; сохраняется только итоговое число шагов.',
        'Технические данные: сессионная cookie для входа и обычные серверные логи.',
      ],
    },
    {
      heading: '2. Зачем мы это обрабатываем',
      body: [
        'Чтобы предоставлять сервис: хранить ваши записи и показывать историю, серии, тренды и сводки.',
        'Чтобы обеспечивать безопасность аккаунта и предотвращать злоупотребления.',
        'Для данных о здоровье правовое основание — ваше явное согласие, данное при создании аккаунта и при выдаче разрешений устройства. Согласие можно отозвать в любой момент, удалив соответствующие записи или весь аккаунт.',
      ],
    },
    {
      heading: '3. Чего мы не делаем',
      body: [
        'Не продаём ваши данные и не передаём их брокерам данных.',
        'Не используем данные о здоровье, тренировках и локации для рекламы и профилирования.',
        'Не подключаем сторонние скрипты аналитики, рекламы и социальных сетей.',
      ],
    },
    {
      heading: '4. Cookie и локальное хранилище',
      body: [
        'Winterwork ставит одну строго необходимую cookie — она держит вас в аккаунте. Без неё сервис не работает, поэтому отдельное согласие для неё не требуется.',
        'Браузер также хранит локально выбранный язык. Больше ничего не сохраняется, рекламных и аналитических cookie нет.',
      ],
    },
    {
      heading: '5. Кто видит ваши данные',
      body: [
        'Ваши записи видны только вам после входа. Социальных функций и функций обмена нет.',
        'Поставщики услуг хостинга и инфраструктуры могут обрабатывать данные по нашему поручению на основании договора и только для этой цели.',
        'Мы можем раскрыть данные, когда это требуется по закону, и будем оспаривать чрезмерно широкие запросы, когда это разумно возможно.',
      ],
    },
    {
      heading: '6. Сколько это хранится',
      body: [
        'Данные хранятся, пока существует аккаунт, — смысл продукта в длительной истории.',
        'При удалении аккаунта записи немедленно удаляются из рабочей базы. В зашифрованных резервных копиях они могут оставаться недолгий срок до перезаписи.',
      ],
    },
    {
      heading: '7. Ваши права',
      body: [
        'Доступ и переносимость: в любой момент выгрузите полную машиночитаемую копию всех данных аккаунта в Настройках, без обращения к нам.',
        'Удаление: удалите аккаунт и данные в Настройках в любой момент.',
        'Исправление: измените любую запись прямо в приложении.',
        'Отзыв согласия: отзовите разрешение на геолокацию или датчики движения в браузере — остальное приложение продолжит работать.',
        'Если вы находитесь в ЕС, Великобритании или другом регионе с аналогичным регулированием, у вас также есть право подать жалобу в надзорный орган по защите данных.',
      ],
    },
    {
      heading: '8. Безопасность',
      body: [
        'Пароли хешируются bcrypt. Сессионные cookie помечены HTTP-only и secure в продакшене. Доступ к записям ограничен вашим аккаунтом при каждом запросе.',
        'Идеально защищённых систем не бывает. При утечке, затрагивающей ваши данные, мы уведомим пользователей и надзорный орган в порядке, требуемом законом.',
      ],
    },
    {
      heading: '9. Дети',
      body: [
        `Winterwork не предназначен для лиц младше ${OPERATOR.minimumAge} лет. Мы сознательно не собираем данные детей. Если вы считаете, что аккаунт создан ребёнком, — свяжитесь с нами, и мы его удалим.`,
      ],
    },
    {
      heading: '10. Изменения и контакты',
      body: [
        'При существенных изменениях политики вам будет предложено ознакомиться с ней при следующем входе.',
        `Вопросы или реализация права, недоступного самостоятельно: ${OPERATOR.contactEmail}`,
      ],
    },
  ],
};

export function getLegalDocument(kind: 'terms' | 'privacy', lang: 'en' | 'ru'): LegalDocument {
  if (kind === 'terms') return lang === 'ru' ? TERMS_RU : TERMS_EN;
  return lang === 'ru' ? PRIVACY_RU : PRIVACY_EN;
}
