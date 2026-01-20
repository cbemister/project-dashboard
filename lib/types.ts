// Category is now dynamic based on user settings
export type Category = string;

export type TechStack =
  | 'nextjs'
  | 'react'
  | 'vite'
  | 'vue'
  | 'python'
  | 'node'
  | 'unknown';

export interface GitInfo {
  hasRepo: boolean;
  lastCommitDate: string | null;
  lastCommitMessage: string | null;
  hasUncommittedChanges: boolean;
  branch: string | null;
}

export interface Project {
  id: string;
  name: string;
  path: string;
  category: Category;

  // Auto-detected
  techStack: TechStack;
  hasPackageJson: boolean;
  git: GitInfo;
  sizeBytes: number;
  lastModified: string;

  // User-editable (persisted)
  isFocus: boolean;
  isFavorite: boolean;
  notes: string;
}

export interface ProjectUserData {
  isFocus: boolean;
  isFavorite: boolean;
  notes: string;
}

export interface PersistedData {
  projects: Record<string, ProjectUserData>;
  lastScan: string;
}
