import { chromium } from 'playwright';
const BASE = 'https://127.0.0.1:8797';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const ctx = await b.newContext({ ignoreHTTPSErrors: true, viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await p.evaluate(() => fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'demo@winterwork.test', password: 'Passw0rd!demo' }) }));

const today = (new Date().getDay() + 6) % 7;
const seeded = await p.evaluate(async (today) => {
  const existing = await (await fetch('/api/planner')).json();
  for (const t of existing.tasks) await fetch(`/api/planner/${t.id}`, { method: 'DELETE' });
  const mk = (title, weekday, startMin, endMin, backlog = false) =>
    fetch('/api/planner', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title, weekday, startMin, endMin, backlog }) }).then((r) => r.json());
  await mk('Call the bank', today, 10 * 60, 10 * 60 + 30);
  await mk('Write the brief', today, null, null);
  await mk('Tomorrow only', (today + 1) % 7, null, null);
  await mk('Someday', null, null, null, true);
  return (await (await fetch('/api/planner')).json()).tasks.map((t) => `${t.title} wd=${t.weekday} backlog=${t.backlog}`);
}, today);
console.log('seeded:', seeded);

await p.goto(BASE + '/today', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(1500);
await p.click('text=Got it').catch(() => {});
await p.waitForTimeout(400);
const shown = await p.locator('.t-task-title').allInnerTexts();
console.log('shown on Today:', shown, '(must be exactly the two due today)');
console.log('summary line:', (await p.locator('.t-summary-items').innerText()).replace(/\n/g, ' '));
await p.screenshot({ path: '/tmp/claude-0/today-tasks.png', fullPage: true });

// ticking one off from Today must persist
await p.locator('.t-task .today-check').first().click();
await p.waitForTimeout(1400);
const after = await p.evaluate(() => fetch('/api/planner').then((r) => r.json()));
console.log('after ticking:', after.tasks.map((t) => `${t.title}:${t.done}`).join(' '));
console.log('summary now:', (await p.locator('.t-summary-items').innerText()).replace(/\n/g, ' '));
await b.close(); process.exit(0);
