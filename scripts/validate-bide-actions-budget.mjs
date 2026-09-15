#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const workflowsDir = path.join(root, '.github', 'workflows');
const allowedTopLevelTrigger = 'workflow_dispatch';
const forbiddenChainMarkers = [
  '/actions/workflows/',
  'gh workflow run',
  'git push',
];

function extractOnBlock(text) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => line === 'on:');
  if (start < 0) return [];

  const block = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line && !/^\s/.test(line) && !/^\s*#/.test(line)) break;
    block.push(line);
  }
  return block;
}

function topLevelTriggers(block) {
  return block
    .map((line) => line.match(/^  ([A-Za-z0-9_-]+)\s*:/)?.[1] || null)
    .filter(Boolean);
}

const workflowFiles = fs.readdirSync(workflowsDir)
  .filter((name) => name.endsWith('.yml') || name.endsWith('.yaml'))
  .sort();

const failures = [];

for (const filename of workflowFiles) {
  const filepath = path.join(workflowsDir, filename);
  const text = fs.readFileSync(filepath, 'utf8');
  const triggers = topLevelTriggers(extractOnBlock(text));

  if (triggers.length !== 1 || triggers[0] !== allowedTopLevelTrigger) {
    failures.push(`${filename}: expected only workflow_dispatch, found [${triggers.join(', ')}]`);
  }

  const lowered = text.toLowerCase();
  for (const marker of forbiddenChainMarkers) {
    if (lowered.includes(marker.toLowerCase())) {
      failures.push(`${filename}: forbidden hidden workflow/branch chaining marker: ${marker}`);
    }
  }
}

if (failures.length) {
  console.error('bIDE GitHub Actions budget policy failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`bIDE Actions budget policy passed: ${workflowFiles.length} workflows are manual-only with no hidden workflow or git-push chaining.`);
