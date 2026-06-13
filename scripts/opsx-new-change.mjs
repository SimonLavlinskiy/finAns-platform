#!/usr/bin/env node
/**
 * Атомарно создаёт OpenSpec change И ветку propose/<name>.
 *
 * Usage:
 *   node scripts/opsx-new-change.mjs <change-name>
 *   pnpm opsx:new <change-name>
 */
import { execSync } from 'node:child_process';

function run(cmd, opts = {}) {
  return execSync(cmd, { stdio: 'inherit', ...opts });
}
function capture(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}
function fail(msg) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

const name = process.argv[2];

if (!name) {
  fail('Не указано имя change. Использование: pnpm opsx:new <change-name>');
}
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
  fail(`Имя "${name}" не в kebab-case. Пример: project-bootstrap, mvp-transactions.`);
}

const branch = `propose/${name}`;

let dirty = '';
try {
  dirty = capture('git status --porcelain');
} catch {
  fail('Не git-репозиторий или git недоступен.');
}

const blocking = dirty
  .split('\n')
  .filter(Boolean)
  .filter((line) => {
    const path = line.slice(3);
    const isTrackedChange = !line.startsWith('??');
    const isThisChange = path.startsWith(`openspec/changes/${name}/`);
    return isTrackedChange && !isThisChange;
  });

if (blocking.length > 0) {
  console.error('\n✗ В рабочем дереве есть незакоммиченные изменения:');
  console.error(blocking.map((l) => `    ${l}`).join('\n'));
  fail('Закоммить/спрячь их (git stash) перед созданием нового change.');
}

console.log(`\n▶ Создаю change "${name}" + ветку ${branch}\n`);

try {
  run('git fetch origin', { stdio: 'ignore' });
} catch {
  console.warn('  ⚠ git fetch не удался (оффлайн?) — продолжаю на локальном состоянии.');
}

run(`git checkout -B ${branch}`);
console.log(`  ✓ На ветке ${branch}`);

run(`npx openspec new change "${name}"`);

console.log(`\n✓ Готово. Ветка: ${branch}, change: openspec/changes/${name}/`);
console.log('  Дальше: генерируй артефакты (proposal → specs → design → tasks → test_case),');
console.log('  затем /opsx:spec-review для commit + push + PR.\n');
