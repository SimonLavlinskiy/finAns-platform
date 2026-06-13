import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { loadWorkspaceConfig } from './workspace-config.mjs';

function verifyService(service, workspaceDir) {
  const dest = resolve(workspaceDir, service.name);

  if (!existsSync(dest)) {
    console.error(`[${service.name}] NOT FOUND — run make init`);
    return false;
  }

  if (!existsSync(resolve(dest, '.git'))) {
    console.error(`[${service.name}] NOT A GIT REPO`);
    return false;
  }

  let hasCommits = false;
  try {
    execSync(`git -C ${dest} rev-parse --verify HEAD`, { stdio: 'ignore' });
    hasCommits = true;
  } catch {
    hasCommits = false;
  }

  if (!hasCommits) {
    console.log(`[${service.name}] OK — empty repo (no commits yet)`);
    return true;
  }

  let currentRef;
  try {
    currentRef = execSync(`git -C ${dest} describe --exact-match --tags 2>/dev/null || git -C ${dest} rev-parse --abbrev-ref HEAD`, { encoding: 'utf-8' }).trim();
  } catch {
    console.error(`[${service.name}] FAILED TO GET CURRENT REF`);
    return false;
  }

  const expected = service.ref;
  const type = service.type;

  let match = false;

  if (type === 'tag') {
    match = currentRef === expected;
  } else {
    match = currentRef === expected;
  }

  if (match) {
    console.log(`[${service.name}] OK — ${currentRef}`);
  } else {
    console.error(`[${service.name}] MISMATCH — expected ${expected}, got ${currentRef}`);
    return false;
  }

  return true;
}

function main() {
  const configPath = resolve(process.argv[2] || 'workspace.yaml');

  if (!existsSync(configPath)) {
    console.error(`Config not found: ${configPath}`);
    process.exit(1);
  }

  const { workspaceDir, services } = loadWorkspaceConfig(configPath);

  console.log(`Verifying workspace: ${workspaceDir}`);
  console.log('');

  let allOk = true;

  for (const service of services) {
    if (!verifyService(service, workspaceDir)) {
      allOk = false;
    }
  }

  console.log('');
  if (allOk) {
    console.log('All services verified.');
  } else {
    console.error('Some services have mismatches.');
    process.exit(1);
  }
}

main();
