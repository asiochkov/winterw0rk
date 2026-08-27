/**
 * Screenshots one screen of the v6 prototype, so an app screen can be compared
 * against the thing it is being transferred from.
 *
 * v6 restores its whole state from localStorage under `winterwork.v6`, so the
 * screen and its data can be seeded rather than clicked to. The seed has to go
 * in through addInitScript: setting it after the first load loses the race with
 * the prototype's own debounced save, which writes `screen: 'today'` back over
 * it.
 *
 * Serve the prototype first:
 *   node tools/build-prototype-bundle.mjs
 *   cd dist/prototype && python3 -m http.server 8097
 *
 * Then, from this directory:
 *   node prototype-screen.mjs ssummary out.png '{"sumSets":6,"sumTon":1832}'
 *
 * The screen keys are v6's own: today, train, sactive, ssummary, habits,
 * detail, quit, progress, focus, mood, ffood, street, planner, profile,
 * settings, fex, flib, fplans, fplan, progdetail, welcome, signin, signup, onb.
 */
import { chromium } from 'playwright';

const screen = process.argv[2];
const out = process.argv[3] || `${screen}.png`;
const extra = process.argv[4] ? JSON.parse(process.argv[4]) : {};
const base = process.env.PROTOTYPE_URL || 'http://127.0.0.1:8097/';

if (!screen) {
  console.error('usage: node prototype-screen.mjs <screen-key> [out.png] [state-json]');
  process.exit(2);
}

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 500, height: 1100 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));

await ctx.addInitScript(
  ([screen, extra]) => {
    localStorage.setItem(
      'winterwork.v6',
      JSON.stringify({
        _v: 1,
        _at: Date.now(),
        lang: 'en',
        theme: 'night',
        world: 'fit',
        plan: 'plus',
        consentGiven: true,
        screen,
        ...extra,
      })
    );
  },
  [screen, extra]
);

await p.goto(base, { waitUntil: 'networkidle' });
await p.waitForTimeout(4000);

// Each screen carries its own data-screen-label; the one that rendered is the
// one v6 settled on, which is not always the one that was asked for (an
// interrupted session, for instance, is bounced back to Today).
const labels = await p.evaluate(() =>
  [...document.querySelectorAll('[data-screen-label]')].map((e) => e.dataset.screenLabel)
);
if (labels.length !== 1) {
  console.error(`expected one screen, got ${JSON.stringify(labels)}`);
  await b.close();
  process.exit(1);
}

const el = await p.$('[data-screen-label]');
await el.screenshot({ path: out });
console.log(`${labels[0]} -> ${out}`);
console.log(await el.innerText());

await b.close();
process.exit(0);
