#!/usr/bin/env node
/**
 * Sync spec-driven schema skills and commands to all AI tool dirs.
 * Запуск: node scripts/sync-schema-skills.mjs
 * Или:    pnpm openspec:schema-sync
 */
import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCHEMA = 'spec-driven';

const TARGETS = [
  { label: 'Cursor',     skillsDir: '.cursor/skills',    commandsDir: '.cursor/commands' },
  { label: 'Claude',     skillsDir: '.claude/skills',    commandsDir: '.claude/commands' },
  { label: 'Kilocode',   skillsDir: '.kilocode/skills',  commandsDir: '.kilocode/workflows' },
  { label: 'Windsurf',   skillsDir: '.windsurf/skills',  commandsDir: '.windsurf/workflows' },
  { label: 'Codex',      skillsDir: '.codex/skills',     commandsDir: '.codex/prompts' },
];

function findRepoRoot(startDir = process.cwd()) {
  let dir = startDir;
  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, 'openspec', 'config.yaml'))) return dir;
    dir = dirname(dir);
  }
  throw new Error('Repo root not found (openspec/config.yaml)');
}

function syncSkills(repoRoot, schemaDir, target) {
  const srcRoot = join(schemaDir, 'skills');
  if (!existsSync(srcRoot)) return [];

  const destRoot = join(repoRoot, target.skillsDir);
  mkdirSync(destRoot, { recursive: true });

  const synced = [];
  for (const name of readdirSync(srcRoot)) {
    const skillPath = join(srcRoot, name, 'SKILL.md');
    if (!existsSync(skillPath)) continue;
    const destDir = join(destRoot, name);
    mkdirSync(destDir, { recursive: true });
    cpSync(skillPath, join(destDir, 'SKILL.md'));
    synced.push(name);
  }
  return synced;
}

function syncCommands(repoRoot, schemaDir, target) {
  const srcRoot = join(schemaDir, 'commands');
  if (!existsSync(srcRoot)) return [];

  const destRoot = join(repoRoot, target.commandsDir);
  mkdirSync(destRoot, { recursive: true });

  const synced = [];
  for (const file of readdirSync(srcRoot)) {
    if (!file.endsWith('.md')) continue;
    const src = join(srcRoot, file);
    if (!statSync(src).isFile()) continue;
    const dest = join(destRoot, file);
    cpSync(src, dest);
    synced.push(file);
  }
  return synced;
}

function main() {
  const repoRoot = findRepoRoot();
  const schemaDir = join(repoRoot, 'openspec', 'schemas', SCHEMA);

  if (!existsSync(join(schemaDir, 'schema.yaml'))) {
    console.error(`Schema not found: ${schemaDir}`);
    process.exit(1);
  }

  console.log(`Syncing schema "${SCHEMA}" extensions to AI tool dirs…\n`);

  for (const target of TARGETS) {
    const skills = syncSkills(repoRoot, schemaDir, target);
    const commands = syncCommands(repoRoot, schemaDir, target);

    console.log(`${target.label} (${target.commandsDir}):`);
    if (skills.length) console.log(`  skills:   ${skills.join(', ')}`);
    if (commands.length) console.log(`  commands: ${commands.map(f => f.replace('.md', '')).join(', ')}`);
  }

  console.log('\nDone. Все агенты синхронизированы.');
}

main();
