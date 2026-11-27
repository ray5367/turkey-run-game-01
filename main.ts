// Turkey Trot — the hand-in program (Node 22, standard library only). It copies
// the game's static files and the screenshots into /output and writes the
// dossier the judge reads, using the vendored make.fun library. Run it locally
// with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the game itself with `node serve.ts` (http://localhost:8080).
import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** Count every file and directory under a path, for the pre-flight check. */
function countEntries(path) {
  let count = 1;
  for (const name of readdirSync(path)) {
    const child = join(path, name);
    count += statSync(child).isDirectory() ? countEntries(child) : 1;
  }
  return count;
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps, from the kit's gate: the text cap shapes the dossier's
// bytes; the rest refuse an entry the scorer would refuse (more than 4 screenshots
// or one over 256 KiB; game/ over 993 entries or 48 MiB, or a path over 1000 bytes).
const gameEntries = countEntries(join(out, 'game'));
if (gameEntries > 993) throw new Error(`game/ holds ${gameEntries} entries, over the 993 cap`);
const shots = readdirSync(join(out, 'screenshots')).filter((n) => !n.startsWith('.'));
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`screenshots/ holds ${shots.length} images, need 3 or 4`);
}
for (const name of shots) {
  const bytes = statSync(join(out, 'screenshots', name)).size;
  if (bytes > 262144) throw new Error(`screenshots/${name} is ${bytes} bytes, over the 256 KiB cap`);
}

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
