// Vice Cover Studio — gta6-cover-art-01 entry program (Node 22, stdlib only).
//
// The app is plain static files in app/ (app/index.html plus its ES modules,
// vendored fonts and sample photos; no build step, no network request), and
// this program hands it in: it copies app/ and screenshots/ from beside this
// file to /output and writes /output/dossier.json with the vendored make.fun
// library (vendor/makefun-app.ts), exactly as the kit's starter does.
//
// Serve the app locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The entry is deterministic: both runs of this program write the same bytes
// (a straight copy plus a dossier built from those files).

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's caps (reference/gate.json): app/ at most 993 files and
// 48 MiB, screenshots/ at most 4 files of 256 KiB, dossier at most 1.5 MiB.
// Check the counts here so a bad tree fails loudly instead of silently
// handing in an entry the gate would refuse.
function countTree(dir) {
  let files = 0;
  let bytes = 0;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) {
      const sub = countTree(p);
      files += sub.files;
      bytes += sub.bytes;
    } else if (s.isFile()) {
      files += 1;
      bytes += s.size;
    }
  }
  return { files, bytes };
}

const appTree = countTree(join(here, 'app'));
if (appTree.files > 993) throw new Error(`app/ holds ${appTree.files} files, over the 993 cap`);
if (appTree.bytes > 48 * 1024 * 1024) throw new Error(`app/ holds ${appTree.bytes} bytes, over the 48 MiB cap`);

const shotsDir = join(here, 'screenshots');
const shotNames = existsSync(shotsDir) ? readdirSync(shotsDir).filter((n) => !n.startsWith('.')) : [];
if (shotNames.length < 3 || shotNames.length > 4) {
  throw new Error(`screenshots/ holds ${shotNames.length} files, need 3 or 4`);
}
for (const name of shotNames) {
  const size = statSync(join(shotsDir, name)).size;
  if (size > 256 * 1024) throw new Error(`screenshots/${name} is ${size} bytes, over the 256 KiB cap`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// buildDossier writes the dossier the judge reads: the App block, then every
// source file in load order, capped at 160 KiB of text.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
