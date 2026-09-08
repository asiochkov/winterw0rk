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
const made = await p.evaluate(async (today) => {
  // Idempotent: the script seeds its own fixtures, so clear the previous run's
  // before adding them again or every run doubles what is on screen.
  const existing = await (await fetch('/api/planner')).json();
  const mine = ['Morning walk', 'Team call', 'Deep work', 'Read the brief', 'Climbing'];
  for (const task of existing.tasks) {
    if (mine.includes(task.title)) await fetch(`/api/planner/${task.id}`, { method: 'DELETE' });
  }
  const mk = (title, weekday, startMin, endMin) =>
    fetch('/api/planner', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title, weekday, startMin, endMin }) }).then((r) => r.json());
  const a = await mk('Morning walk', today, 7 * 60 + 30, 8 * 60 + 15);
  const b2 = await mk('Team call', today, 11 * 60, 12 * 60);
  const c = await mk('Deep work', today, 14 * 60, 16 * 60 + 30);
  const d = await mk('Read the brief', today, null, null);
  const e = await mk('Climbing', (today + 1) % 7, 18 * 60, 20 * 60);
  return [a, b2, c, d, e].map((r) => r.task && `${r.task.title} ${r.task.startMin}..${r.task.endMin}`);
}, today);
console.log('created:', made);

await p.goto(BASE + '/planner', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(1400);
await p.click('text=Got it').catch(() => {});
await p.waitForTimeout(300);
console.log('tabs:', await p.locator('.type-btn').allInnerTexts());
console.log('nav visible on planner:', await p.locator('.ww-nav, .side-nav').count() > 0);

console.log('phone default view — day cards:', await p.locator('.tl-card').count(), '| week grid:', await p.locator('.tl-week-col').count());
const posDay = await p.$$eval('.tl-card', (els) => els.map((e) => ({ t: e.querySelector('.tl-card-title')?.textContent, top: Math.round(e.getBoundingClientRect().top), h: Math.round(e.getBoundingClientRect().height) })));
console.log('day placement:', posDay);
console.log('loose listed:', await p.locator('.tl-loose-row').count());
await p.screenshot({ path: '/tmp/claude-0/planner-day.png', fullPage: true });

// switch to the week grid
await p.click('.type-btn:has-text("Week")');
await p.waitForTimeout(600);
console.log('week columns:', await p.locator('.tl-week-col').count());
console.log('week cards:', await p.locator('.tl-card').count());
console.log('now-line count (must be 1, today only):', await p.locator('.tl-now').count());
await p.screenshot({ path: '/tmp/claude-0/planner-week.png', fullPage: true });

// expand a day from the week grid
await p.locator('.tl-week-day').nth(today).click();
await p.waitForTimeout(600);
console.log('after expanding, day cards:', await p.locator('.tl-card').count());
const positions = await p.$$eval('.tl-card', (els) =>
  els.map((e) => ({ title: e.querySelector('.tl-card-title')?.textContent, top: Math.round(e.getBoundingClientRect().top), h: Math.round(e.getBoundingClientRect().height) }))
);
console.log('placed:', positions);
console.log('loose (untimed) tasks listed:', await p.locator('.tl-loose-row').count());

// collapse back
await p.click('.planner-daystrip-back');
await p.waitForTimeout(500);
console.log('collapsed back to week:', await p.locator('.tl-week-col').count() === 7);
await b.close(); process.exit(0);
