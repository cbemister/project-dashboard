import { NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { z } from 'zod';
import {
  scanProjects,
  loadPersistedData,
  mergeWithPersistedData,
} from '@/lib/scanner';
import type { Project } from '@/lib/types';

const updateProjectSchema = z.object({
  projectId: z.string().min(1),
  updates: z.object({
    isFocus: z.boolean().optional(),
    isFavorite: z.boolean().optional(),
    notes: z.string().optional(),
  }),
});

const CACHE_PATH = path.join(process.cwd(), 'data', 'cache.json');
const CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes

interface CachedData {
  projects: Project[];
  timestamp: number;
}

async function loadCache(): Promise<CachedData | null> {
  if (!existsSync(CACHE_PATH)) return null;
  try {
    const content = await readFile(CACHE_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function saveCache(projects: Project[]): Promise<void> {
  const data: CachedData = { projects, timestamp: Date.now() };
  await writeFile(CACHE_PATH, JSON.stringify(data));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const forceRefresh = url.searchParams.get('refresh') === 'true';

  try {
    const [cache, persisted] = await Promise.all([
      loadCache(),
      loadPersistedData(),
    ]);

    // Return cache if fresh enough and not forcing refresh
    if (cache && !forceRefresh) {
      const age = Date.now() - cache.timestamp;
      if (age < CACHE_MAX_AGE) {
        const merged = mergeWithPersistedData(cache.projects, persisted);
        return NextResponse.json({
          projects: merged,
          lastScan: new Date(cache.timestamp).toISOString(),
          cached: true,
        });
      }
    }

    // Scan fresh
    const projects = await scanProjects();
    const merged = mergeWithPersistedData(projects, persisted);

    // Save cache in background (don't await)
    saveCache(projects).catch(() => {});

    return NextResponse.json({
      projects: merged,
      lastScan: new Date().toISOString(),
      cached: false,
    });
  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json(
      { error: 'Failed to scan projects' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const validation = updateProjectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    const { projectId, updates } = validation.data;
    const persisted = await loadPersistedData();

    persisted.projects[projectId] = {
      isFocus: updates.isFocus ?? persisted.projects[projectId]?.isFocus ?? false,
      isFavorite:
        updates.isFavorite ?? persisted.projects[projectId]?.isFavorite ?? false,
      notes: updates.notes ?? persisted.projects[projectId]?.notes ?? '',
    };

    const dataPath = path.join(process.cwd(), 'data', 'projects.json');
    await writeFile(dataPath, JSON.stringify(persisted, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}
