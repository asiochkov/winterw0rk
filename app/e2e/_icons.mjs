/**
 * Renders the raster app icons from app/client/public/favicon.svg.
 *
 * The SVG covers the browser tab on its own, but iOS home-screen icons and the
 * web manifest both want PNGs at fixed sizes, so they are generated here rather
 * than hand-exported — re-run this after changing the mark and the set stays
 * consistent.
 *
 * Usage: node tools/make-icons.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const PUBLIC = path.join(ROOT, 'app', 'client', 'public');
const SRC = path.join(PUBLIC, 'favicon.svg');

/** apple-touch-icon is 180; the manifest asks for 192 and 512. */
const SIZES = [
  { px: 180, as: 'apple-touch-icon.png' },
  { px: 192, as: 'icon-192.png' },
  { px: 512, as: 'icon-512.png' },
];

const svg = fs.readFileSync(SRC, 'utf8');
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox'],
});

for (const { px, as } of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: px, height: px } });
  const page = await ctx.newPage();
  await page.setContent(
    `<body style="margin:0">${svg.replace('<svg ', `<svg width="${px}" height="${px}" `)}</body>`
  );
  await page.waitForTimeout(120);
  await page.screenshot({ path: path.join(PUBLIC, as) });
  await ctx.close();
  console.log(`${as}  ${px}x${px}`);
}

await browser.close();
process.exit(0);
