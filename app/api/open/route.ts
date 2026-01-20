import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';
import { loadSettings } from '@/lib/settings';

const execAsync = promisify(exec);

const openSchema = z.object({
  path: z.string().min(1),
  app: z.enum(['vscode', 'cursor', 'explorer', 'terminal']),
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
    const validation = openSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    const { path: projectPath, app } = validation.data;
    const normalizedPath = normalizePath(projectPath);
    const normalizedRoot = normalizePath(settings.rootPath);

    // Security: ensure path is within configured root
    if (!normalizedPath.startsWith(normalizedRoot)) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      );
    }

    // Use the original path for the command (Windows needs backslashes)
    const winPath = projectPath.replace(/\//g, '\\');

    switch (app) {
      case 'vscode':
        await execAsync(`code "${winPath}"`);
        break;
      case 'cursor':
        await execAsync(`cursor "${winPath}"`);
        break;
      case 'explorer':
        await execAsync(`explorer "${winPath}"`);
        break;
      case 'terminal':
        // Open Windows Terminal at the project path
        await execAsync(`wt -d "${winPath}"`);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid app' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Open error:', error);
    return NextResponse.json(
      { error: 'Failed to open' },
      { status: 500 }
    );
  }
}
