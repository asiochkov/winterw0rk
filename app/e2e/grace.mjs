import { chromium } from 'playwright';
const BASE = 'https://127.0.0.1:8797';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const ctx = await b.newContext({ ignoreHTTPSErrors: true, viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
const email = `gr${Date.now()}@test.com`;
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
const out = await p.evaluate(async (email) => {
  await fetch('/api/auth/signup', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123', name: 'T', acceptedTerms: true, acceptedPrivacy: true, confirmedAge: true }) });
  await fetch('/api/auth/onboarding', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ goal: 'body', areas: ['Sleep'], habits: [{ name: 'Read', category: 'MIND', type: 'bool', schedule: [0,1,2,3,4,5,6] }] }) });
  const h = await (await fetch('/api/habits')).json();
  const id = h.habits[0].id;
  const day = (n) => { const d = new Date(); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0,10); };
  // done today and 2..6 days back; ONE day (yesterday) missed
  for (const n of [0, 2, 3, 4, 5, 6]) {
    await fetch(`/api/habits/${id}/complete`, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ value: 1, date: day(n) }) });
  }
  const after = await (await fetch('/api/habits')).json();
  return { habit: after.habits[0], id, yesterday: day(1) };
}, email);
console.log('streak:', out.habit.streak, '(a plain miss would have made this 1)');
console.log('best:', out.habit.best, 'rate:', out.habit.rate + '%');
console.log('forgiven:', out.habit.forgiven, ' yesterday was', out.yesterday);
console.log('week cells:', out.habit.week.map((d) => `${d.date.slice(8)}:${!d.scheduled ? 'off' : d.done ? 'done' : d.forgiven ? 'GRACE' : 'miss'}`).join(' '));

await p.goto(BASE + '/habits', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(1100);
const graceCell = await p.evaluate(() => {
  const el = document.querySelector('.hb-cell.is-grace');
  if (!el) return null;
  const cs = getComputedStyle(el);
  return { bg: cs.backgroundColor, border: cs.borderColor };
});
console.log('grace cell drawn as:', graceCell);
await p.screenshot({ path: '/tmp/claude-0/grace.png', fullPage: true });
await b.close(); process.exit(0);
