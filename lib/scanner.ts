import { readdir, stat, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type { Project, Category, TechStack, PersistedData } from './types';
import { getGitInfo } from './git-utils';
import { loadSettings } from './settings';

export async function scanProjects(): Promise<Project[]> {
  const settings = await loadSettings();

  if (!settings.rootPath || !existsSync(settings.rootPath)) {
    return []; // No root path configured
  }

  const ignoredFolders = settings.ignoredFolders || [];

  // Auto-detect category folders from root directory
  const rootEntries = await readdir(settings.rootPath, { withFileTypes: true });
  const categoryFolders = rootEntries
    .filter((e) => e.isDirectory() && !ignoredFolders.includes(e.name))
    .map((e) => e.name);

  // Collect all project paths
  const projectInfos: { path: string; category: string }[] = [];

  for (const category of categoryFolders) {
    const categoryPath = path.join(settings.rootPath, category);

    if (!existsSync(categoryPath)) continue;

    const entries = await readdir(categoryPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (ignoredFolders.includes(entry.name)) continue;

      projectInfos.push({
        path: path.join(categoryPath, entry.name),
        category,
      });
    }
  }

  // Scan all projects in parallel (batched for performance)
  const BATCH_SIZE = 10;
  const projects: Project[] = [];

  for (let i = 0; i < projectInfos.length; i += BATCH_SIZE) {
    const batch = projectInfos.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map((info) => scanProject(info.path, info.category))
    );
    projects.push(...results.filter((p): p is Project => p !== null));
  }

  return projects;
}

async function scanProject(
  projectPath: string,
  category: string
): Promise<Project | null> {
  try {
    const name = path.basename(projectPath);
    const hasPackageJson = existsSync(path.join(projectPath, 'package.json'));

    // Run all async operations in parallel
    const [stats, techStack, git, sizeBytes] = await Promise.all([
      stat(projectPath),
      detectTechStack(projectPath),
      getGitInfo(projectPath),
      getDirectorySize(projectPath),
    ]);

    return {
      id: Buffer.from(projectPath).toString('base64url'),
      name,
      path: projectPath,
      category,
      techStack,
      hasPackageJson,
      git,
      sizeBytes,
      lastModified: stats.mtime.toISOString(),
      isFocus: false,
      isFavorite: false,
      notes: '',
    };
  } catch {
    return null;
  }
}

async function detectTechStack(projectPath: string): Promise<TechStack> {
  const packageJsonPath = path.join(projectPath, 'package.json');

  if (!existsSync(packageJsonPath)) {
    if (existsSync(path.join(projectPath, 'requirements.txt'))) {
      return 'python';
    }
    return 'unknown';
  }

  try {
    const content = await readFile(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(content);
    const deps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };

    if ('next' in deps) return 'nextjs';
    if ('vite' in deps) return 'vite';
    if ('vue' in deps) return 'vue';
    if ('react' in deps) return 'react';
    return 'node';
  } catch {
    return 'unknown';
  }
}

async function getDirectorySize(dirPath: string): Promise<number> {
  // Fast estimate: only count top-level files (skip recursive scan)
  let totalSize = 0;

  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    // Just count immediate files for a quick estimate
    const fileStats = await Promise.all(
      entries
        .filter((e) => e.isFile())
        .slice(0, 20) // Limit to first 20 files
        .map(async (e) => {
          try {
            const s = await stat(path.join(dirPath, e.name));
            return s.size;
          } catch {
            return 0;
          }
        })
    );

    totalSize = fileStats.reduce((a, b) => a + b, 0);
  } catch {
    // Ignore errors
  }

  return totalSize;
}

export async function loadPersistedData(): Promise<PersistedData> {
  const dataPath = path.join(process.cwd(), 'data', 'projects.json');

  if (!existsSync(dataPath)) {
    return { projects: {}, lastScan: '' };
  }

  try {
    const content = await readFile(dataPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { projects: {}, lastScan: '' };
  }
}

export function mergeWithPersistedData(
  projects: Project[],
  persisted: PersistedData
): Project[] {
  return projects.map((project) => {
    const userData = persisted.projects[project.id];
    if (userData) {
      return {
        ...project,
        isFocus: userData.isFocus,
        isFavorite: userData.isFavorite,
        notes: userData.notes,
      };
    }
    return project;
  });
}
