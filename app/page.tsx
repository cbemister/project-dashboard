'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import type { Project, Category } from '@/lib/types';

type SortField = 'name' | 'category' | 'lastCommit' | 'size';
type SortDir = 'asc' | 'desc';
type Editor = 'vscode' | 'cursor';
type DefaultAction = 'editor' | 'explorer' | 'terminal';

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showStaleOnly, setShowStaleOnly] = useState(false);
  const [editor, setEditor] = useState<Editor>('vscode');
  const [defaultAction, setDefaultAction] = useState<DefaultAction>('editor');

  useEffect(() => {
    fetchProjects();
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.editor) setEditor(data.editor);
      if (data.defaultAction) setDefaultAction(data.defaultAction);
    } catch {
      // Use default
    }
  }

  async function fetchProjects(forceRefresh = false) {
    try {
      // Only show loading spinner on initial load
      if (projects.length === 0) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const url = forceRefresh ? '/api/projects?refresh=true' : '/api/projects';
      const res = await fetch(url);
      const data = await res.json();
      setProjects(data.projects);

      // If we got cached data, silently refresh in background
      if (data.cached && !forceRefresh) {
        fetch('/api/projects?refresh=true')
          .then((r) => r.json())
          .then((fresh) => setProjects(fresh.projects))
          .catch(() => {}); // Ignore background refresh errors
      }
    } catch {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function toggleFavorite(project: Project) {
    const newValue = !project.isFavorite;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === project.id ? { ...p, isFavorite: newValue } : p
      )
    );

    await fetch('/api/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: project.id,
        updates: { isFavorite: newValue },
      }),
    });
  }

  async function toggleFocus(project: Project) {
    const newValue = !project.isFocus;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === project.id ? { ...p, isFocus: newValue } : p
      )
    );

    await fetch('/api/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: project.id,
        updates: { isFocus: newValue },
      }),
    });
  }

  async function archiveProject(project: Project) {
    if (!confirm(`Archive "${project.name}"?`)) return;

    // Optimistic update - remove from list immediately
    setProjects((prev) => prev.filter((p) => p.id !== project.id));

    try {
      const res = await fetch('/api/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath: project.path,
          projectName: project.name,
        }),
      });

      if (res.ok) {
        // Refresh to get updated archive list
        fetchProjects(true);
      } else {
        // Revert on failure
        fetchProjects(true);
      }
    } catch {
      alert('Failed to archive project');
      fetchProjects(true);
    }
  }

  async function openProject(project: Project, action?: 'editor' | 'explorer' | 'terminal') {
    const targetAction = action || defaultAction;
    // If action is 'editor', use the configured editor (vscode/cursor)
    const app = targetAction === 'editor' ? editor : targetAction;

    await fetch('/api/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: project.path, app }),
    });
  }

  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter((p) => p.category === categoryFilter);
    }

    // Stale filter (no commits in 90+ days)
    if (showStaleOnly) {
      const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
      result = result.filter((p) => {
        if (!p.git.lastCommitDate) return true;
        return new Date(p.git.lastCommitDate).getTime() < ninetyDaysAgo;
      });
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;

      // Focus projects first
      if (a.isFocus !== b.isFocus) {
        return a.isFocus ? -1 : 1;
      }

      // Favorites second
      if (a.isFavorite !== b.isFavorite) {
        return a.isFavorite ? -1 : 1;
      }

      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'category':
          cmp = a.category.localeCompare(b.category);
          break;
        case 'lastCommit':
          const dateA = a.git.lastCommitDate
            ? new Date(a.git.lastCommitDate).getTime()
            : 0;
          const dateB = b.git.lastCommitDate
            ? new Date(b.git.lastCommitDate).getTime()
            : 0;
          cmp = dateB - dateA;
          break;
        case 'size':
          cmp = b.sizeBytes - a.sizeBytes;
          break;
      }

      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [projects, search, categoryFilter, sortField, sortDir, showStaleOnly]);

  const focusProjects = projects.filter((p) => p.isFocus);
  const categories = Array.from(new Set(projects.map((p) => p.category)));

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  function getActivityClass(project: Project): string {
    if (!project.git.hasRepo || !project.git.lastCommitDate) {
      return styles.activityStale;
    }
    const daysSince = Math.floor(
      (Date.now() - new Date(project.git.lastCommitDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    if (daysSince <= 7) return styles.activityActive;
    if (daysSince <= 30) return styles.activityRecent;
    return styles.activityStale;
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Scanning projects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  // Show setup prompt if no projects found (likely no root path configured)
  if (projects.length === 0 && !loading) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>Project Dashboard</h1>
          <Link href="/settings" className={styles.settingsLink}>
            Settings
          </Link>
        </header>
        <div className={styles.setup}>
          <h2>Welcome to Project Dashboard</h2>
          <p>To get started, configure your projects root directory in settings.</p>
          <Link href="/settings" className={styles.setupBtn}>
            Open Settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Project Dashboard</h1>
        <div className={styles.headerRight}>
          <div className={styles.stats}>
            <span>{projects.length} projects</span>
            <span>{focusProjects.length} in focus</span>
          </div>
          <Link href="/settings" className={styles.settingsLink}>
            Settings
          </Link>
        </div>
      </header>

      {focusProjects.length > 0 && (
        <section className={styles.focusSection}>
          <h2>Focus Projects</h2>
          <div className={styles.focusGrid}>
            {focusProjects.map((project) => (
              <div
                key={project.id}
                className={styles.focusCard}
                onClick={() => openProject(project)}
                title="Click to open"
              >
                <div className={styles.focusName}>{project.name}</div>
                <div className={styles.focusMeta}>
                  <span className={styles.categoryBadge}>{project.category}</span>
                  <span>{project.techStack}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={styles.filters}>
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as Category | 'all')}
          className={styles.select}
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={showStaleOnly}
            onChange={(e) => setShowStaleOnly(e.target.checked)}
          />
          Stale only (90+ days)
        </label>
        <button
          onClick={() => fetchProjects(true)}
          className={styles.refreshBtn}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </section>

      <table className={styles.table}>
        <thead>
          <tr>
            <th></th>
            <th onClick={() => handleSort('name')} className={styles.sortable}>
              Name {sortField === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
            </th>
            <th
              onClick={() => handleSort('category')}
              className={styles.sortable}
            >
              Category{' '}
              {sortField === 'category' && (sortDir === 'asc' ? '↑' : '↓')}
            </th>
            <th>Tech</th>
            <th>Activity</th>
            <th
              onClick={() => handleSort('lastCommit')}
              className={styles.sortable}
            >
              Last Commit{' '}
              {sortField === 'lastCommit' && (sortDir === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('size')} className={styles.sortable}>
              Size {sortField === 'size' && (sortDir === 'asc' ? '↑' : '↓')}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredProjects.map((project) => (
            <tr
              key={project.id}
              className={project.category === '_Archive' ? styles.archived : ''}
            >
              <td className={styles.icons}>
                <button
                  onClick={() => toggleFavorite(project)}
                  className={`${styles.iconBtn} ${
                    project.isFavorite ? styles.active : ''
                  }`}
                  title="Favorite"
                >
                  ★
                </button>
                <button
                  onClick={() => toggleFocus(project)}
                  className={`${styles.iconBtn} ${
                    project.isFocus ? styles.active : ''
                  }`}
                  title="Focus"
                >
                  ◎
                </button>
              </td>
              <td className={styles.name}>
                {project.name}
                {project.git.hasUncommittedChanges && (
                  <span className={styles.uncommitted} title="Uncommitted changes">
                    •
                  </span>
                )}
              </td>
              <td>
                <span className={styles.categoryBadge}>{project.category}</span>
              </td>
              <td>{project.techStack}</td>
              <td>
                <span
                  className={`${styles.activityDot} ${getActivityClass(project)}`}
                />
              </td>
              <td>{formatDate(project.git.lastCommitDate)}</td>
              <td>{formatSize(project.sizeBytes)}</td>
              <td className={styles.actions}>
                <button
                  onClick={() => openProject(project, 'editor')}
                  className={styles.actionBtn}
                  title="Open in Editor"
                >
                  Code
                </button>
                <button
                  onClick={() => openProject(project, 'explorer')}
                  className={styles.actionBtn}
                  title="Open in Explorer"
                >
                  Folder
                </button>
                <button
                  onClick={() => openProject(project, 'terminal')}
                  className={styles.actionBtn}
                  title="Open Terminal"
                >
                  Terminal
                </button>
                {project.category !== '_Archive' && (
                  <button
                    onClick={() => archiveProject(project)}
                    className={styles.archiveBtn}
                    title="Archive project"
                  >
                    Archive
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredProjects.length === 0 && (
        <div className={styles.empty}>No projects match your filters</div>
      )}
    </div>
  );
}
