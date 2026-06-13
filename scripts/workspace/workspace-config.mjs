import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/**
 * @typedef {{ repoRoot: string, workspaceDir: string, services: Array<{ name: string, repo?: string, ref?: string, type?: string }> }} WorkspaceConfig
 */

/**
 * @param {string} [configPath]
 * @returns {WorkspaceConfig}
 */
export function loadWorkspaceConfig(configPath = resolve(process.cwd(), 'workspace.yaml')) {
  if (!existsSync(configPath)) {
    throw new Error(`workspace.yaml not found: ${configPath}`);
  }

  const content = readFileSync(configPath, 'utf8');
  let workspaceDir = './workspace';
  const services = [];
  let currentService = null;

  for (const line of content.split('\n')) {
    const trimmed = line.trim();

    if (trimmed.startsWith('workspace:')) {
      const dirMatch = trimmed.match(/dir:\s*(.+)/);
      if (dirMatch) workspaceDir = dirMatch[1].trim();
      continue;
    }

    if (trimmed === 'services:') continue;

    const nameMatch = trimmed.match(/^- name:\s*(.+)/);
    if (nameMatch) {
      if (currentService) services.push(currentService);
      currentService = { name: nameMatch[1].trim() };
      continue;
    }

    if (!currentService) continue;

    const repoMatch = trimmed.match(/repo:\s*(.+)/);
    if (repoMatch) {
      currentService.repo = repoMatch[1].trim();
      continue;
    }
    const refMatch = trimmed.match(/ref:\s*(.+)/);
    if (refMatch) {
      currentService.ref = refMatch[1].trim();
      continue;
    }
    const typeMatch = trimmed.match(/type:\s*(.+)/);
    if (typeMatch) {
      currentService.type = typeMatch[1].trim();
    }
  }

  if (currentService) services.push(currentService);

  const repoRoot = dirname(configPath);
  return {
    repoRoot,
    workspaceDir: resolve(repoRoot, workspaceDir),
    services,
  };
}
