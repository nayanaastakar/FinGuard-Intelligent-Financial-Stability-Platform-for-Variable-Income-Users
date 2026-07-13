import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, '../src/locales');

function deepAssign(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      deepAssign(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

for (const lang of ['hi', 'ta', 'te', 'kn']) {
  const localePath = path.join(localesDir, `${lang}.json`);
  const overridePath = path.join(localesDir, 'overrides', `${lang}.json`);
  const locale = JSON.parse(fs.readFileSync(localePath, 'utf8'));
  const overrides = JSON.parse(fs.readFileSync(overridePath, 'utf8'));
  deepAssign(locale, overrides);
  fs.writeFileSync(localePath, `${JSON.stringify(locale, null, 2)}\n`);
  console.log(`Applied overrides to ${lang}.json`);
}
