/**
 * Packs the exported Claude Design prototype into two shippable forms:
 *
 *   dist/prototype/            a plain static folder (drop on any static host)
 *   dist/winterwork-prototype.html   one self-contained file, no network at all
 *
 * The export as it comes out of Claude Design pulls React, ReactDOM and Babel
 * from unpkg, which makes it depend on a third party staying up. Both outputs
 * vendor those instead, from the npm tarballs.
 *
 * Usage: node tools/build-prototype-bundle.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import os from 'node:os';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'project');
const OUT = path.join(ROOT, 'dist');
const STATIC_DIR = path.join(OUT, 'prototype');
const VENDOR_DIR = path.join(STATIC_DIR, 'vendor');

/**
 * The prototype export to build.
 *
 * v6 is the reference the app is being transferred from — see CONTINUE.md for
 * the token-by-token comparison that settled it. v7 is a later iteration that
 * left that design system, so building it here would make every comparison
 * screenshot the wrong screen. Override with PROTOTYPE=... to look at another
 * version deliberately.
 */
const EXPORT = process.env.PROTOTYPE || 'Winterwork v6.dc.html';

/** Each unpkg URL the export loads, and the npm package + path that replaces it. */
const VENDORED = [
  {
    url: 'https://unpkg.com/react@18.3.1/umd/react.production.min.js',
    pkg: 'react@18.3.1',
    file: 'umd/react.production.min.js',
    as: 'react.production.min.js',
  },
  {
    url: 'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js',
    pkg: 'react-dom@18.3.1',
    file: 'umd/react-dom.production.min.js',
    as: 'react-dom.production.min.js',
  },
  {
    url: 'https://unpkg.com/@babel/standalone@7.29.0/babel.min.js',
    pkg: '@babel/standalone@7.29.0',
    file: 'babel.min.js',
    as: 'babel.min.js',
  },
];

function fetchVendored() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ww-vendor-'));
  fs.mkdirSync(VENDOR_DIR, { recursive: true });
  for (const v of VENDORED) {
    const dir = path.join(tmp, v.as);
    fs.mkdirSync(dir, { recursive: true });
    const tgz = execFileSync('npm', ['pack', v.pkg, '--silent'], { cwd: dir, encoding: 'utf8' }).trim();
    execFileSync('tar', ['xzf', tgz], { cwd: dir });
    fs.copyFileSync(path.join(dir, 'package', v.file), path.join(VENDOR_DIR, v.as));
  }
  fs.rmSync(tmp, { recursive: true, force: true });
}

function buildStatic() {
  fs.rmSync(STATIC_DIR, { recursive: true, force: true });
  fs.mkdirSync(STATIC_DIR, { recursive: true });
  fs.copyFileSync(path.join(SRC, EXPORT), path.join(STATIC_DIR, 'index.html'));
  fs.copyFileSync(path.join(SRC, 'image-slot.js'), path.join(STATIC_DIR, 'image-slot.js'));

  let support = fs.readFileSync(path.join(SRC, 'support.js'), 'utf8');
  for (const v of VENDORED) {
    if (!support.includes(v.url)) throw new Error(`support.js no longer loads ${v.url}`);
    support = support.replaceAll(v.url, `./vendor/${v.as}`);
  }
  fs.writeFileSync(path.join(STATIC_DIR, 'support.js'), support);
  fetchVendored();
}

function buildSingleFile() {
  const read = (p) => fs.readFileSync(path.join(STATIC_DIR, p), 'utf8');
  const html = read('index.html');

  const start = html.indexOf('<body>') + '<body>'.length;
  const end = html.lastIndexOf('</body>');
  if (start < 10 || end < 0) throw new Error('body markers not found in the export');
  let body = html.slice(start, end);

  const slotTag = '<script src="./image-slot.js"></script>';
  if (!body.includes(slotTag)) throw new Error('image-slot script tag not found in the export');
  body = body.replace(slotTag, '');

  const payload = [...VENDORED.map((v) => `vendor/${v.as}`), 'image-slot.js', 'support.js'].map(read);

  // Two things make a single file work at all:
  //
  // 1. The runtime treats the document it boots into as its own template source,
  //    so a <script> left sitting in the body gets mistaken for the component's
  //    logic. The bootstrap moves every library into <head> synchronously and
  //    deletes itself, so once <x-dc> is parsed the body looks exactly as it did
  //    when these were external files.
  // 2. Setting __resources stops boot() from re-fetching location.href and
  //    re-parsing the raw file — that parse would find this bootstrap instead of
  //    the component. The DOM it has already parsed is the correct template.
  //
  // The React/Babel loaders short-circuit on window.React and window.Babel, so
  // with the libraries in place the page makes no script requests at all.
  const bootstrap =
    '<script>(function(){window.__resources={};var c=document.currentScript;var S=' +
    JSON.stringify(payload) +
    ';for(var i=0;i<S.length;i++){var s=document.createElement("script");s.textContent=S[i];' +
    'document.head.appendChild(s);}c.remove();})();</script>\n';

  const out = '<title>Winterwork</title>\n' + bootstrap + body;
  fs.writeFileSync(path.join(OUT, 'winterwork-prototype.html'), out);
  return out.length;
}

buildStatic();
const bytes = buildSingleFile();
console.log(`static folder: ${STATIC_DIR}`);
console.log(`single file:   ${path.join(OUT, 'winterwork-prototype.html')} (${(bytes / 1048576).toFixed(2)} MB)`);
