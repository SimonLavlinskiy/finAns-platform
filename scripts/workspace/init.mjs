import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { loadWorkspaceConfig } from './workspace-config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

function cloneService(service, workspaceDir) {
  const dest = resolve(workspaceDir, service.name);

  if (existsSync(dest) && existsSync(resolve(dest, '.git'))) {
    console.log(`[${service.name}] already cloned, skipping`);
    return;
  }

  console.log(`[${service.name}] cloning ${service.repo}...`);

  try {
    execSync(`git clone ${service.repo} ${dest}`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`[${service.name}] failed to clone`);
    process.exit(1);
  }

  try {
    execSync(`git -C ${dest} checkout ${service.ref}`, { stdio: 'pipe' });
    console.log(`[${service.name}] checked out ${service.ref}`);
  } catch {
    let hasCommits = false;
    try {
      execSync(`git -C ${dest} rev-parse --verify HEAD`, { stdio: 'ignore' });
      hasCommits = true;
    } catch {
      hasCommits = false;
    }
    if (!hasCommits) {
      console.warn(`[${service.name}] empty repo — skipping checkout ${service.ref}`);
    } else {
      console.error(`[${service.name}] failed to checkout ${service.ref}`);
      process.exit(1);
    }
  }
}

function main() {
  const configPath = resolve(process.argv[2] || 'workspace.yaml');

  if (!existsSync(configPath)) {
    console.error(`Config not found: ${configPath}`);
    process.exit(1);
  }

  const { workspaceDir, services } = loadWorkspaceConfig(configPath);

  console.log(`Workspace dir: ${workspaceDir}`);
  console.log(`Services: ${services.length}`);
  console.log('');

  if (!existsSync(workspaceDir)) {
    mkdirSync(workspaceDir, { recursive: true });
  }

  for (const service of services) {
    cloneService(service, workspaceDir);
  }

  console.log('\nDone. All services initialized under workspace/.');
}

main();
