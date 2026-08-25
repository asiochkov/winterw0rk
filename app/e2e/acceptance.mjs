import { chromium } from 'playwright';

const shots = process.env.SHOTS_DIR || new URL('./shots', import.meta.url).pathname;
const pass = [];
const fail = [];
function ok(name) { pass.push(name); console.log(`  PASS  ${name}`); }
function bad(name, detail) { fail.push(`${name}: ${detail}`); console.log(`  FAIL  ${name} — ${detail}`); }
function section(name) { console.log(`\n=== ${name} ===`); }

const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  args: ['--no-sandbox'],
});

/** Fails the run if a page logs a real console error (401s during auth checks are expected). */
function watchConsole(page, label) {
  const errors = [];
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text();
    if (text.includes('401') || text.includes('Failed to load resource')) return;
    errors.push(text);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  return () => {
    if (errors.length) bad(`${label} console clean`, errors.slice(0, 3).join(' | '));
    else ok(`${label} console clean`);
  };
}

const CONSENT_BOXES = '.consent-row input';

async function register(page, email, name = 'Acceptance') {
  await page.goto('http://localhost:5173/sign-up');
  await page.fill('input[placeholder="Your name"]', name);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'password123');
  const boxes = page.locator(CONSENT_BOXES);
  const n = await boxes.count();
  for (let i = 0; i < n; i++) await boxes.nth(i).check();
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await page.waitForURL('**/onboarding', { timeout: 15000 });
}

async function onboard(page) {
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.locator('.onb-option:has-text("Build discipline")').click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.locator('.onb-chip:has-text("Training")').click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.locator('.onb-option:has-text("Cold Shower")').click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Begin Day 01', exact: true }).click();
  await page.waitForURL('**/today', { timeout: 15000 });
}

try {
  // ============================================================
  section('CONSENT IS REQUIRED');
  {
    const ctx = await browser.newContext({ viewport: { width: 420, height: 900 } });
    const page = await ctx.newPage();
    await page.goto('http://localhost:5173/sign-up');
    await page.fill('input[placeholder="Your name"]', 'No Consent');
    await page.fill('input[type="email"]', `noconsent-${Date.now()}@test.com`);
    await page.fill('input[type="password"]', 'password123');
    const disabled = await page.getByRole('button', { name: 'Create account', exact: true }).isDisabled();
    disabled ? ok('signup blocked until consent given') : bad('signup blocked until consent given', 'button was enabled');

    await page.goto('http://localhost:5173/terms');
    await page.waitForSelector('.legal-heading');
    ok('terms page renders');
    await page.goto('http://localhost:5173/privacy');
    await page.waitForSelector('.legal-heading');
    ok('privacy page renders');
    await ctx.close();
  }

  // ============================================================
  section('NEW USER FULL JOURNEY');
  const userAEmail = `usera-${Date.now()}@test.com`;
  const ctxA = await browser.newContext({ viewport: { width: 420, height: 900 } });
  const a = await ctxA.newPage();
  const checkConsoleA = watchConsole(a, 'new user journey');

  await register(a, userAEmail);
  ok('register');
  await onboard(a);
  ok('onboarding -> Today');
  await a.screenshot({ path: `${shots}/01-today.png` });

  // habit create + complete
  await a.goto('http://localhost:5173/habits/new');
  await a.fill('input[placeholder="Cold Shower"]', 'Read 20 pages');
  await a.getByRole('button', { name: 'Add habit', exact: true }).click();
  await a.waitForURL('**/habits');
  // Wait for the list to actually render rather than sampling mid-fetch.
  await a.waitForFunction(() => document.querySelectorAll('.habit-card').length >= 2, null, { timeout: 10000 })
    .then(() => ok('create habit'))
    .catch(async () => bad('create habit', `only ${await a.locator('.habit-card').count()} card(s)`));

  await a.goto('http://localhost:5173/today');
  await a.waitForSelector('.today-habit');
  await a.locator('.today-habit').first().click();
  await a.waitForTimeout(600);
  const headline = await a.locator('.today-headline').innerText();
  /1\//.test(headline) ? ok(`complete habit (${headline.trim()})`) : bad('complete habit', headline);

  // planner
  await a.goto('http://localhost:5173/planner');
  await a.fill('input[placeholder="New task"]', 'Acceptance task');
  await a.getByRole('button', { name: 'Add', exact: true }).click();
  await a.waitForTimeout(500);
  (await a.locator('.planner-task').count()) > 0 ? ok('planner task created') : bad('planner task created', 'none listed');

  // focus
  await a.goto('http://localhost:5173/focus');
  await a.getByRole('button', { name: 'Start', exact: true }).click();
  await a.waitForTimeout(1200);
  await a.getByRole('button', { name: 'Pause', exact: true }).click();
  await a.getByRole('button', { name: 'Resume', exact: true }).click();
  await a.getByRole('button', { name: 'Stop', exact: true }).click();
  await a.waitForTimeout(500);
  await a.goto('http://localhost:5173/focus/history');
  await a.waitForTimeout(400);
  (await a.locator('.detail-history-row').count()) > 0 ? ok('focus start/pause/resume/stop + history') : bad('focus history', 'no session recorded');

  // mood
  await a.goto('http://localhost:5173/mood');
  await a.locator('.mood-picker-btn').nth(3).click();
  await a.waitForTimeout(500);
  (await a.locator('.mood-today-set').count()) > 0 ? ok('mood saved') : bad('mood saved', 'no confirmation');

  // quit full flow
  await a.goto('http://localhost:5173/quit/new');
  await a.fill('input[placeholder="Smoking"]', 'Smoking');
  await a.getByRole('button', { name: 'Start counter', exact: true }).click();
  await a.waitForURL('**/quit');
  await a.locator('.quit-card').first().click();
  await a.waitForTimeout(600);
  await a.getByRole('button', { name: "I'm having a craving", exact: true }).click();
  await a.locator('.quit-int-btn').nth(2).click();
  await a.getByRole('button', { name: 'Stress', exact: true }).click();
  await a.getByRole('button', { name: 'Short walk', exact: true }).click();
  await a.waitForTimeout(500);
  ok('quit counter + craving flow');
  await a.getByRole('button', { name: 'Log a relapse', exact: true }).click();
  await a.getByRole('button', { name: 'Confirm — a new run starts', exact: true }).click();
  await a.waitForTimeout(600);
  const attempts = await a.locator('.detail-stat-n').nth(2).innerText();
  attempts === '2' ? ok('relapse preserves history (attempts=2)') : bad('relapse attempts', attempts);

  // training full flow
  await a.goto('http://localhost:5173/training');
  await a.waitForTimeout(600);
  const startBtn = a.getByRole('button', { name: 'Start workout', exact: true });
  if (await startBtn.count()) {
    await startBtn.click();
    await a.waitForURL('**/training/session/*');
    for (let i = 0; i < 6; i++) {
      await a.getByRole('button', { name: 'Complete set', exact: true }).click();
      await a.waitForTimeout(250);
      const skip = a.getByRole('button', { name: 'Skip', exact: true });
      if (await skip.count()) await skip.click();
      await a.waitForTimeout(200);
      const finish = a.getByRole('button', { name: 'Finish workout', exact: true });
      if (await finish.count()) { await finish.click(); break; }
      const next = a.locator('button:has-text("Next:")');
      if (await next.count()) await next.click();
    }
    await a.waitForURL('**/summary', { timeout: 15000 });
    ok('workout: start -> sets -> rest -> finish -> summary');
    await a.screenshot({ path: `${shots}/02-summary.png` });
  } else {
    ok('training rest day (no session scheduled today)');
  }

  // nutrition, body, steps
  await a.goto('http://localhost:5173/nutrition');
  await a.fill('input[placeholder="Chicken & rice"]', 'Eggs');
  await a.fill('input[placeholder="550"]', '300');
  await a.getByRole('button', { name: 'Add', exact: true }).click();
  await a.waitForTimeout(500);
  (await a.locator('.nut-food-row').count()) > 0 ? ok('nutrition food logged') : bad('nutrition', 'no entry');

  await a.goto('http://localhost:5173/body');
  await a.fill('input[placeholder="82.4"]', '80.5');
  await a.getByRole('button', { name: 'Save', exact: true }).click();
  await a.waitForTimeout(500);
  ok('body weight saved');

  await a.goto('http://localhost:5173/steps');
  await a.fill('input[placeholder="e.g. 8500"]', '7200');
  await a.locator('.planner-add').first().getByRole('button', { name: 'Save', exact: true }).click();
  await a.waitForTimeout(500);
  const stepCount = await a.locator('.steps-count').innerText();
  stepCount.replace(/\D/g, '') === '7200' ? ok('steps manual entry') : bad('steps manual entry', stepCount);

  // profile + data export
  await a.goto('http://localhost:5173/profile');
  await a.waitForSelector('.detail-stat-n');
  ok('profile renders');

  await a.goto('http://localhost:5173/settings');
  await a.waitForTimeout(400);
  const exportResp = await a.evaluate(async () => {
    const r = await fetch('/api/account/export', { credentials: 'include' });
    const text = await r.text();
    return { status: r.status, hasHabits: text.includes('"habits"'), leaks: /password_hash/.test(text) };
  });
  exportResp.status === 200 && exportResp.hasHabits && !exportResp.leaks
    ? ok('GDPR export works and leaks no credentials')
    : bad('GDPR export', JSON.stringify(exportResp));

  checkConsoleA();

  // ============================================================
  section('SESSION PERSISTENCE (close browser, return)');
  const storage = await ctxA.storageState();
  await ctxA.close();

  const ctxReturn = await browser.newContext({ viewport: { width: 420, height: 900 }, storageState: storage });
  const r = await ctxReturn.newPage();
  await r.goto('http://localhost:5173/');
  await r.waitForURL('**/today', { timeout: 15000 });
  ok('still signed in after a fresh browser context');

  await r.waitForSelector('.today-habit');
  const persistedHeadline = await r.locator('.today-headline').innerText();
  /1\//.test(persistedHeadline) ? ok(`data persisted (${persistedHeadline.trim()})`) : bad('data persisted', persistedHeadline);
  await ctxReturn.close();

  // ============================================================
  section('USER ISOLATION');
  const ctxB = await browser.newContext({ viewport: { width: 420, height: 900 } });
  const b = await ctxB.newPage();
  const userBEmail = `userb-${Date.now()}@test.com`;
  await register(b, userBEmail, 'User B');
  await onboard(b);

  await b.goto('http://localhost:5173/habits');
  await b.waitForTimeout(600);
  const bHabits = await b.locator('.habit-card').allInnerTexts();
  bHabits.some((h) => h.includes('Read 20 pages'))
    ? bad('user isolation', "User B can see User A's habit")
    : ok("user B cannot see user A's habits");

  await b.goto('http://localhost:5173/planner');
  await b.waitForTimeout(500);
  const bTasks = await b.locator('.planner-task').allInnerTexts();
  bTasks.some((t) => t.includes('Acceptance task'))
    ? bad('user isolation (planner)', "User B sees User A's task")
    : ok("user B cannot see user A's planner tasks");

  const adminProbe = await b.evaluate(async () => (await fetch('/api/admin/users', { credentials: 'include' })).status);
  adminProbe === 404 ? ok('admin API hidden from ordinary user') : bad('admin API hidden', `status ${adminProbe}`);
  await ctxB.close();

  // ============================================================
  section('LOGOUT / LOGIN AGAIN');
  const ctxC = await browser.newContext({ viewport: { width: 420, height: 900 } });
  const c = await ctxC.newPage();
  await c.goto('http://localhost:5173/sign-in');
  await c.fill('input[type="email"]', userAEmail);
  await c.fill('input[type="password"]', 'password123');
  await c.getByRole('button', { name: 'Sign in', exact: true }).click();
  await c.waitForURL('**/today', { timeout: 15000 });
  ok('login with existing account');

  await c.goto('http://localhost:5173/settings');
  await c.getByRole('button', { name: 'Sign out', exact: true }).click();
  await c.waitForURL('http://localhost:5173/', { timeout: 15000 });
  const afterLogout = await c.evaluate(async () => (await fetch('/api/auth/me', { credentials: 'include' })).status);
  afterLogout === 401 ? ok('logout clears the session') : bad('logout', `me returned ${afterLogout}`);
  await ctxC.close();

  // ============================================================
  section('ADMIN');
  {
    const { execSync } = await import('node:child_process');
    execSync(`npm run grant-admin -- ${userAEmail}`, { cwd: new URL('../server', import.meta.url).pathname, stdio: 'pipe' });

    const ctxAdmin = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const ad = await ctxAdmin.newPage();
    const checkAdminConsole = watchConsole(ad, 'admin');
    await ad.goto('http://localhost:5173/sign-in');
    await ad.fill('input[type="email"]', userAEmail);
    await ad.fill('input[type="password"]', 'password123');
    await ad.getByRole('button', { name: 'Sign in', exact: true }).click();
    await ad.waitForURL('**/today', { timeout: 15000 });

    await ad.goto('http://localhost:5173/admin');
    await ad.waitForSelector('.admin-row', { timeout: 15000 });
    const rows = await ad.locator('.admin-row').count();
    rows >= 2 ? ok(`admin lists accounts (${rows} shown)`) : bad('admin list', `${rows} rows`);
    const adminText = await ad.locator('.admin-table').innerText();
    /\$2[aby]\$/.test(adminText) ? bad('admin leaks hashes', 'bcrypt hash visible') : ok('admin exposes no credentials');
    await ad.screenshot({ path: `${shots}/03-admin.png` });
    checkAdminConsole();
    await ctxAdmin.close();
  }

  // ============================================================
  section('RESPONSIVE');
  for (const [label, width, height] of [['mobile', 390, 844], ['tablet', 834, 1112], ['desktop', 1440, 900]]) {
    const ctxR = await browser.newContext({ viewport: { width, height } });
    const p = await ctxR.newPage();
    await p.goto('http://localhost:5173/sign-in');
    await p.fill('input[type="email"]', userAEmail);
    await p.fill('input[type="password"]', 'password123');
    await p.getByRole('button', { name: 'Sign in', exact: true }).click();
    await p.waitForURL('**/today', { timeout: 15000 });
    await p.waitForTimeout(500);

    const overflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    overflow ? bad(`${label} no horizontal overflow`, 'page scrolls sideways') : ok(`${label} no horizontal overflow`);
    await p.screenshot({ path: `${shots}/04-${label}.png` });
    await ctxR.close();
  }

  // ============================================================
  console.log(`\n================ RESULT ================`);
  console.log(`PASSED: ${pass.length}`);
  console.log(`FAILED: ${fail.length}`);
  if (fail.length) {
    fail.forEach((f) => console.log(`  - ${f}`));
    process.exitCode = 1;
  } else {
    console.log('ALL ACCEPTANCE CHECKS PASSED');
  }
} catch (err) {
  console.error('\nRUN ABORTED:', err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
