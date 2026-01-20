import { NextResponse } from 'next/server';
import { rename } from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { loadSettings } from '@/lib/settings';

const archiveSchema = z.object({
  projectPath: z.string().min(1),
  projectName: z.string().min(1),
});

function normalizePath(p: string): string {
  return p.replace(/\\/g, '/').toLowerCase();
}

export async function POST(request: Request) {
  try {
    const settings = await loadSettings();

    if (!settings.rootPath) {
      return NextResponse.json(
        { error: 'Root path not configured' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = archiveSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    const { projectPath, projectName } = validation.data;
    const normalizedProjectPath = normalizePath(projectPath);
    const normalizedRootPath = normalizePath(settings.rootPath);

    // Validate the path is within the configured root
    if (!normalizedProjectPath.startsWith(normalizedRootPath)) {
      return NextResponse.json(
        { error: 'Invalid project path' },
        { status: 400 }
      );
    }

    // Don't archive if already in _Archive
    if (normalizedProjectPath.includes('_archive')) {
      return NextResponse.json(
        { error: 'Project is already archived' },
        { status: 400 }
      );
    }

    const archivePath = path.join(settings.rootPath, '_Archive', projectName);

    await rename(projectPath, archivePath);

    return NextResponse.json({
      success: true,
      newPath: archivePath,
    });
  } catch (error) {
    console.error('Archive error:', error);
    return NextResponse.json(
      { error: 'Failed to archive project' },
      { status: 500 }
    );
  }
}
