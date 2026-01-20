import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import path from 'path';
import type { GitInfo } from './types';

const execAsync = promisify(exec);

export async function getGitInfo(projectPath: string): Promise<GitInfo> {
  const gitDir = path.join(projectPath, '.git');

  if (!existsSync(gitDir)) {
    return {
      hasRepo: false,
      lastCommitDate: null,
      lastCommitMessage: null,
      hasUncommittedChanges: false,
      branch: null,
    };
  }

  try {
    // Single combined git command for speed
    const { stdout } = await execAsync(
      'git log -1 --format="%ci|||%s" 2>nul & git branch --show-current 2>nul & git status --porcelain 2>nul',
      { cwd: projectPath, timeout: 5000 }
    );

    const lines = stdout.split('\n').filter(Boolean);
    const logLine = lines[0] || '';
    const [commitDate, commitMessage] = logLine.split('|||');
    const branch = lines[1] || '';
    const hasChanges = lines.slice(2).some((l) => l.trim().length > 0);

    return {
      hasRepo: true,
      lastCommitDate: commitDate || null,
      lastCommitMessage: commitMessage || null,
      hasUncommittedChanges: hasChanges,
      branch: branch.trim() || null,
    };
  } catch {
    return {
      hasRepo: true,
      lastCommitDate: null,
      lastCommitMessage: null,
      hasUncommittedChanges: false,
      branch: null,
    };
  }
}
