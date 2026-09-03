import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createUniqueFileName } from '../src/utils/uniqueFileName.js';

assert.equal(createUniqueFileName('orders.csv', new Set()), 'orders.csv');
assert.equal(createUniqueFileName('orders.csv', new Set(['orders.csv'])), 'orders (2).csv');
assert.equal(
  createUniqueFileName('orders.csv', new Set(['orders.csv', 'orders (2).csv'])),
  'orders (3).csv',
);
assert.equal(createUniqueFileName('README', new Set(['README'])), 'README (2)');
assert.equal(
  createUniqueFileName('archive.tar.gz', new Set(['archive.tar.gz'])),
  'archive.tar (2).gz',
);

const ide = fs.readFileSync(new URL('../src/pages/IDE.tsx', import.meta.url), 'utf8');
const explorer = fs.readFileSync(new URL('../src/components/FileExplorer.tsx', import.meta.url), 'utf8');
assert.match(ide, /const usedNames = new Set\(files\.map\(\(file\) => file\.name\)\)/);
assert.match(ide, /createUniqueFileName\(file\.name, usedNames\)/);
assert.match(ide, /Imported.*to keep both files/);
assert.match(explorer, /e\.target\.value\s*=\s*["']{2}/, 'File input must reset so the same file can be selected twice');

console.log('Duplicate bIDE imports receive deterministic, customer-visible unique names.');
