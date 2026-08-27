/**
 * Walks every route at phone and laptop width and records what it finds:
 * a screenshot, plus anything measurable that is wrong on its own terms —
 * horizontal overflow, touch targets under 44px, elements pushed off screen,
 * and console/page errors.
 *
 *   node sweep.mjs
 *
 * Writes /tmp/cmp/sweep/<width>-<route>.png and prints a report.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.env.APP_URL || 'https://127.0.0.1:8797';
const OUT = '/tmp/cmp/sweep';
fs.mkdirSync(OUT, { recursive: true });

const ALL = [
  '/', '/sign-in', '/sign-up', '/forgot-password',
  '/today', '/habits', '/quit', '/planner', '/focus', '/progress',
  '/training', '/training/library', '/mood', '/nutrition', '/body',
  '/street', '/steps', '/programs', '/profile', '/settings', '/more',
];
const ROUTES = process.env.ROUTES ? process.env.ROUTES.split(',') : ALL;

const ONLY = process.argv[2];
const WIDTHS = [
  { w: 390, h: 844, name: 'phone' },
  { w: 1440, h: 900, name: 'laptop' },
].filter((x) => !ONLY || x.name === ONLY);

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const findings = [];

for (const { w, h, name } of WIDTHS) {
  const ctx = await b.newContext({ ignoreHTTPSErrors: true, viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 160)); });

  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await p.evaluate(() => fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'demo@winterwork.test', password: 'Passw0rd!demo' }) }));

  for (const route of ROUTES) {
    errors.length = 0;
    await p.goto(BASE + route, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(900);
    await p.click('text=Got it').catch(() => {});
    await p.waitForTimeout(250);

    const slug = route === '/' ? 'welcome' : route.slice(1).replace(/\//g, '-');
    await p.screenshot({ path: `${OUT}/${name}-${slug}.png` });

    const probe = await p.evaluate((vw) => {
      const out = { overflow: 0, small: [], offscreen: [], emptyMain: false };
      out.overflow = Math.max(0, document.documentElement.scrollWidth - vw);
      const seen = new Set();
      for (const el of document.querySelectorAll('button, a[href], input, select, textarea, [role="button"]')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        const label = (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 28);
        if ((r.height < 44 || r.width < 44) && !seen.has(label)) {
          seen.add(label);
          out.small.push(`${label} ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
        if (r.right > vw + 1 || r.left < -1) out.offscreen.push(label);
      }
      const main = document.querySelector('main');
      out.emptyMain = !!main && main.innerText.trim().length < 12;
      return out;
    }, w);

    findings.push({ name, route, ...probe, errors: [...errors] });
  }
  await ctx.close();
}
await b.close();

console.log('width  route                    overflow  tiny-targets  offscreen  errors');
for (const f of findings) {
  const flag = f.overflow > 0 || f.small.length || f.offscreen.length || f.errors.length || f.emptyMain;
  if (!flag) continue;
  console.log(
    `${f.name.padEnd(6)} ${f.route.padEnd(24)} ${String(f.overflow).padStart(8)} ${String(f.small.length).padStart(13)} ${String(f.offscreen.length).padStart(10)} ${String(f.errors.length).padStart(7)}${f.emptyMain ? '  EMPTY-MAIN' : ''}`
  );
}
fs.writeFileSync(`/tmp/cmp/sweep/findings-${ONLY || 'all'}.json`, JSON.stringify(findings, null, 2));
console.log('\nfull detail: /tmp/cmp/sweep/findings.json');
process.exit(0);
