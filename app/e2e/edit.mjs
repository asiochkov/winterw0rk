import { chromium } from 'playwright';
const BASE = 'https://127.0.0.1:8797';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const ctx = await b.newContext({ ignoreHTTPSErrors: true, viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));

const email = `ed${Date.now()}@test.com`;
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await p.evaluate(async (email) => {
  await fetch('/api/auth/signup', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123', name: 'T', acceptedTerms: true, acceptedPrivacy: true, confirmedAge: true }) });
  await fetch('/api/auth/onboarding', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ goal: 'body', areas: ['Sleep'], habits: [
      { name: 'Lights Out 22:30', category: 'SLEEP', type: 'bool', schedule: [0,1,2,3,4,5,6] },
      { name: 'Workout', category: 'TRAINING', type: 'bool', schedule: [0,2,4] }] }) });
}, email);

await p.goto(BASE + '/habits', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(1200);
// The SLEEP habit used to fall through to the grey fallback icon.
const pods = await p.$$eval('.hb-pod', (els) => els.map((e) => getComputedStyle(e).background.slice(0, 40)));
console.log('category pods:', pods);
await p.screenshot({ path: '/tmp/claude-0/habits-cats.png', fullPage: true });

await p.locator('.hb-name, .hb-title').first().click().catch(() => p.locator('.hb-row').first().click());
await p.waitForTimeout(900);
console.log('detail kicker:', await p.locator('.hd-kicker').innerText());
await p.locator('button:has-text("Edit habit")').click();
await p.waitForTimeout(400);
await p.screenshot({ path: '/tmp/claude-0/habit-edit.png', fullPage: true });
await p.fill('.form-stack input', 'Lights out 23:00');
await p.selectOption('.ww-select', 'MIND');
await p.locator('.day-btn').nth(5).click();
await p.locator('.day-btn').nth(6).click();
await p.locator('button:has-text("Save")').first().click();
await p.waitForTimeout(1200);
const after = await p.evaluate(() => fetch('/api/habits').then((r) => r.json()));
console.log('after edit:', after.habits.map((h) => `${h.name} [${h.category}] ${JSON.stringify(h.schedule)} streak=${h.streak}`));
console.log('detail kicker now:', await p.locator('.hd-kicker').innerText());
await b.close();
process.exit(0);
