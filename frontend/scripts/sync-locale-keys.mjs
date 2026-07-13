import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, '../src/locales');
const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));

function fillMissing(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      fillMissing(target[key], source[key]);
    } else if (target[key] === undefined) {
      target[key] = source[key];
    }
  }
}

for (const lang of ['hi', 'ta', 'te', 'kn']) {
  const filePath = path.join(localesDir, `${lang}.json`);
  const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  fillMissing(existing, en);
  fs.writeFileSync(filePath, `${JSON.stringify(existing, null, 2)}\n`);
  console.log(`Synced ${lang}.json`);
}
