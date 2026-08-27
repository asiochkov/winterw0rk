/**
 * Prints what changed in one screen between two prototype versions.
 *
 * Nine of the app's screens were transcribed from v6 before the reference
 * became v7. Re-transcribing them from scratch would be wasteful when the
 * delta is often a handful of declarations — the navigation turned out to be
 * three — so this finds the delta instead.
 *
 *   node tools/screen-diff.mjs "Today"
 *   node tools/screen-diff.mjs "Today" v5 v7
 *
 * Screen labels are v7's own; `node tools/divergence-report.mjs` lists them.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const label = process.argv[2];
const from = process.argv[3] || 'v6';
const to = process.argv[4] || 'v7';

if (!label) {
  console.error('usage: node tools/screen-diff.mjs "<screen label>" [from] [to]');
  process.exit(2);
}

/** Same depth-counting bound the divergence report uses. */
function screen(version, wanted) {
  const html = fs.readFileSync(path.join(ROOT, 'project', `Winterwork ${version}.dc.html`), 'utf8');
  const m = [...html.matchAll(/data-screen-label="([^"]+)"/g)].find((x) => x[1] === wanted);
  if (!m) return null;
  const tag = /<sc-if\b|<\/sc-if>/g;
  tag.lastIndex = m.index;
  let depth = 1;
  let end = html.length;
  for (let t; (t = tag.exec(html)); ) {
    depth += t[0] === '</sc-if>' ? -1 : 1;
    if (depth === 0) {
      end = t.index;
      break;
    }
  }
  return html.slice(m.index, end);
}

const a = screen(from, label);
const b = screen(to, label);
if (!a || !b) {
  console.error(`screen "${label}" missing from ${!a ? from : to}`);
  process.exit(1);
}
if (a === b) {
  console.log(`"${label}" is identical in ${from} and ${to} — nothing to transfer.`);
  process.exit(0);
}

/**
 * Splitting on ";" lands the diff on individual CSS declarations rather than
 * on whole 400-character style attributes, which is the granularity the change
 * actually lives at.
 */
const split = (s) => s.split(';');
const A = split(a);
const B = split(b);

/** Plain LCS diff; these blocks are small enough that the O(n*m) table is fine. */
const n = A.length;
const mLen = B.length;
const lcs = Array.from({ length: n + 1 }, () => new Uint32Array(mLen + 1));
for (let i = n - 1; i >= 0; i--) {
  for (let j = mLen - 1; j >= 0; j--) {
    lcs[i][j] = A[i] === B[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
  }
}
let i = 0;
let j = 0;
let changes = 0;
while (i < n && j < mLen) {
  if (A[i] === B[j]) {
    i++;
    j++;
  } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
    console.log(`- ${A[i++].trim().slice(0, 300)}`);
    changes++;
  } else {
    console.log(`+ ${B[j++].trim().slice(0, 300)}`);
    changes++;
  }
}
while (i < n) { console.log(`- ${A[i++].trim().slice(0, 300)}`); changes++; }
while (j < mLen) { console.log(`+ ${B[j++].trim().slice(0, 300)}`); changes++; }

console.log(`\n${changes} changed fragments  (${from} → ${to}, "${label}")`);
