import { chromium } from 'playwright';
import fs from 'node:fs';
const [src, out, w = 400, h = 288] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const p = await (await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2 })).newPage();
const content = fs.readFileSync(src, 'utf8');
// An .html file brings its own <body>; wrapping it would nest one inside
// another and the outer, unstyled one would win.
await p.setContent(src.endsWith('.html') ? content : `<body style="margin:0">${content}</body>`);
await p.waitForTimeout(200);
await p.screenshot({ path: out });
console.log(out);
await b.close(); process.exit(0);
