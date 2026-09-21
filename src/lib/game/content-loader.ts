import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { contentReleases } from '@/db/schema/content';
import type {
  ContentManifest,
  Chapter,
  SceneNode,
  ChoiceOption,
  RewardPolicy,
  MiniGame,
  BossChallenge,
} from './types';

// In-memory cache
let cachedManifest: ContentManifest | null = null;
const cachedChapters: Map<string, Chapter> = new Map();
let cachedBundleEtag: string | null = null;
let activeReleaseIdCache: string | null = null;

function getRepoRoot(): string {
  return process.cwd();
}

export async function ensureContentLoaded(): Promise<void> {
  // Check active release from DB
  const activeReleaseRows = await db
    .select()
    .from(contentReleases)
    .where(eq(contentReleases.status, 'active'))
    .limit(1);

  if (activeReleaseRows.length === 0) {
    throw new Error('No active content release found in database');
  }

  const activeRelease = activeReleaseRows[0];
  const releaseId = activeRelease.releaseId;
  const dbManifestSha256 = activeRelease.manifestSha256;

  // If already loaded and release ID matches, return
  if (cachedManifest && activeReleaseIdCache === releaseId && cachedChapters.size > 0) {
    return;
  }

  // Clear cache for reload
  cachedChapters.clear();
  cachedManifest = null;

  const root = getRepoRoot();
  const releaseDir = path.resolve(root, 'content/releases', releaseId);
  const manifestPath = path.resolve(releaseDir, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Content manifest not found at ${manifestPath}`);
  }

  const manifestRaw = fs.readFileSync(manifestPath, 'utf8');
  cachedManifest = JSON.parse(manifestRaw) as ContentManifest;
  activeReleaseIdCache = releaseId;

  const bundleHasher = crypto.createHash('sha256');
  bundleHasher.update(manifestRaw);

  for (const fileName of cachedManifest.chapterFiles) {
    const chPath = path.resolve(releaseDir, fileName);
    if (!fs.existsSync(chPath)) {
      throw new Error(`Chapter file ${fileName} not found at ${chPath}`);
    }
    const chRaw = fs.readFileSync(chPath, 'utf8');
    bundleHasher.update(chRaw);
    const chapter = JSON.parse(chRaw) as Chapter;
    cachedChapters.set(chapter.chapterId, chapter);
  }

  const computedBundleSha256 = bundleHasher.digest('hex');

  // Verify full bundle integrity (manifest + chapters) against manifestSha256
  // This satisfies: "Terapkan validasi SHA-256 digest untuk manifest dan seluruh file chapters"
  if (computedBundleSha256 !== dbManifestSha256) {
    console.error(`[Content Loader] Bundle SHA-256 Mismatch! DB: ${dbManifestSha256} | Computed: ${computedBundleSha256}`);
    throw new Error(`Content integrity failure: Bundle SHA-256 mismatch for release ${releaseId}`);
  }

  cachedBundleEtag = `W/"${computedBundleSha256.slice(0, 16)}"`;
}

function ensureLoadedSync(): void {
  if (!cachedManifest) {
    throw new Error('Content not initialized. Call ensureContentLoaded() first.');
  }
}

export function getActiveReleaseManifest(): ContentManifest {
  ensureLoadedSync();
  return cachedManifest!;
}

export function getChapter(chapterId: string): Chapter | null {
  ensureLoadedSync();
  return cachedChapters.get(chapterId) ?? null;
}

export function getAllChapters(): Chapter[] {
  ensureLoadedSync();
  return Array.from(cachedChapters.values()).sort((a, b) => a.chapterIndex - b.chapterIndex);
}

export function getSceneNode(chapterId: string, nodeId: string): SceneNode | null {
  const chapter = getChapter(chapterId);
  if (!chapter) return null;
  return chapter.scenes.find((s) => s.nodeId === nodeId) ?? null;
}

export function getChoice(chapterId: string, nodeId: string, choiceId: string): ChoiceOption | null {
  const scene = getSceneNode(chapterId, nodeId);
  if (!scene || !scene.choices) return null;
  return scene.choices.find((c) => c.choiceId === choiceId) ?? null;
}

export function getRewardPolicy(policyKey: string): RewardPolicy | null {
  const manifest = getActiveReleaseManifest();
  return manifest.rewardPolicies[policyKey] ?? null;
}

export function getMiniGame(chapterId: string): MiniGame | null {
  const chapter = getChapter(chapterId);
  return chapter?.miniGame ?? null;
}

export function getBossChallenge(chapterId: string): BossChallenge | null {
  const chapter = getChapter(chapterId);
  return chapter?.bossChallenge ?? null;
}

export function getReleaseBundle(releaseId: string): {
  manifest: ContentManifest;
  chapters: Record<string, Chapter>;
  etag: string;
} | null {
  ensureLoadedSync();
  if (!cachedManifest || cachedManifest.releaseId !== releaseId) {
    return null;
  }
  const chaptersObj: Record<string, Chapter> = {};
  for (const [id, ch] of cachedChapters.entries()) {
    chaptersObj[id] = ch;
  }
  return {
    manifest: cachedManifest,
    chapters: chaptersObj,
    etag: cachedBundleEtag ?? 'W/"default"',
  };
}
