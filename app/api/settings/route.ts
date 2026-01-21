import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { z } from 'zod';
import { loadSettings, saveSettings } from '@/lib/settings';

const settingsSchema = z.object({
  rootPath: z.string().optional(),
  ignoredFolders: z.array(z.string()).optional(),
  editor: z.enum(['vscode', 'cursor']).optional(),
  defaultAction: z.enum(['editor', 'explorer', 'terminal']).optional(),
  hasCompletedOnboarding: z.boolean().optional(),
});

export async function GET() {
  try {
    const settings = await loadSettings();

    // Auto-detect categories from root directory
    let detectedCategories: string[] = [];
    if (settings.rootPath && existsSync(settings.rootPath)) {
      const entries = await readdir(settings.rootPath, { withFileTypes: true });
      detectedCategories = entries
        .filter((e) => e.isDirectory())
        .map((e) => e.name);
    }

    return NextResponse.json({
      ...settings,
      detectedCategories,
    });
  } catch (error) {
    console.error('Settings load error:', error);
    return NextResponse.json(
      { error: 'Failed to load settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = settingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Invalid settings' },
        { status: 400 }
      );
    }

    const updated = await saveSettings(validation.data);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Settings save error:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
