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
await p.evaluate(async (today) => {
  const ex = await (await fetch('/api/planner')).json();
  for (const t of ex.tasks) await fetch(`/api/planner/${t.id}`, { method: 'DELETE' });
  const mk = (title, weekday, startMin, endMin, priority = 'normal') =>
    fetch('/api/planner', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title, weekday, startMin, endMin, priority }) });
  await mk('Morning walk', today, 450, 495);
  await mk('Team call', today, 660, 720, 'high');
  await mk('Deep work', today, 840, 990);
  await mk('Read the brief', today, null, null);
  await mk('Climbing', (today + 1) % 7, 1080, 1200);
}, today);

await p.goto(BASE + '/planner', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(1500);
await p.click('text=Got it').catch(() => {});
await p.waitForTimeout(400);
await p.screenshot({ path: '/tmp/claude-0/pl-day.png', fullPage: false });
console.log('day strip:', await p.locator('.planner-daystrip-day').first().innerText().then((s) => s.replace(/\n/g, ' ')));
console.log('add form open by default:', await p.locator('.planner-form').count() > 0);
// the add form must target the day in view
await p.locator('.planner-daystrip-day').nth((today + 2) % 7).click();
await p.waitForTimeout(300);
await p.click('.planner-open-add');
await p.waitForTimeout(400);
console.log('add targets:', await p.locator('.planner-select').inputValue(), '(selected day index was', (today + 2) % 7, ')');
await p.screenshot({ path: '/tmp/claude-0/pl-add.png', fullPage: false });
await p.click('.planner-form-actions button:has-text("Cancel")').catch(() => {});
await p.waitForTimeout(300);
await p.click('.type-btn:has-text("Week")');
await p.waitForTimeout(600);
await p.screenshot({ path: '/tmp/claude-0/pl-week.png', fullPage: false });
await b.close(); process.exit(0);
