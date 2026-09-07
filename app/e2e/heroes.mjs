import { chromium } from 'playwright';
const BASE = 'https://127.0.0.1:8797';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const ctx = await b.newContext({ ignoreHTTPSErrors: true, viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await p.evaluate(() => fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'demo@winterwork.test', password: 'Passw0rd!demo' }) }));
const ids = await p.evaluate(async () => {
  const q = await (await fetch('/api/quit')).json();
  const h = await (await fetch('/api/habits')).json();
  return { quit: q.counters[0].id, habit: h.habits[0].id };
});
for (const [name, route, sel] of [
  ['quit', `/quit/${ids.quit}`, '.ww-hero'],
  ['habit', `/habits/${ids.habit}`, '.ww-hero'],
  ['progress', '/progress', '.card-hero'],
  ['summary', '/progress', '.ww-chip'],
]) {
  await p.goto(BASE + route, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1100);
  const box = await p.locator(sel).first().boundingBox().catch(() => null);
  console.log(name.padEnd(9), sel.padEnd(11), box ? `${Math.round(box.width)}x${Math.round(box.height)} @ y=${Math.round(box.y)}` : 'MISSING');
  await p.screenshot({ path: `/tmp/claude-0/hero-${name}.png` });
}
// the chip must look identical in all four places it used to be copied
const chip = await p.evaluate(() => {
  const el = document.querySelector('.ww-chip');
  if (!el) return null;
  const cs = getComputedStyle(el);
  return { padding: cs.padding, gap: cs.gap, radius: cs.borderRadius, fs: cs.fontSize, bg: cs.backgroundColor };
});
console.log('chip:', chip);
await b.close(); process.exit(0);
