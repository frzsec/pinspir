import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
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

function getRepoRoot(): string {
  return process.cwd();
}

function loadContentFiles(): void {
  if (cachedManifest && cachedChapters.size > 0) {
    return;
  }

  const root = getRepoRoot();
  const releaseDir = path.resolve(root, 'content/releases/pilot-v1-draft');
  const manifestPath = path.resolve(releaseDir, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Content manifest not found at ${manifestPath}`);
  }

  const manifestRaw = fs.readFileSync(manifestPath, 'utf8');
  cachedManifest = JSON.parse(manifestRaw) as ContentManifest;

  const hasher = crypto.createHash('sha256');
  hasher.update(manifestRaw);

  for (const fileName of cachedManifest.chapterFiles) {
    const chPath = path.resolve(releaseDir, fileName);
    if (!fs.existsSync(chPath)) {
      throw new Error(`Chapter file ${fileName} not found at ${chPath}`);
    }
    const chRaw = fs.readFileSync(chPath, 'utf8');
    hasher.update(chRaw);
    const chapter = JSON.parse(chRaw) as Chapter;
    cachedChapters.set(chapter.chapterId, chapter);
  }

  cachedBundleEtag = `W/"${hasher.digest('hex').slice(0, 16)}"`;
}

export function getActiveReleaseManifest(): ContentManifest {
  loadContentFiles();
  if (!cachedManifest) {
    throw new Error('Manifest not loaded');
  }
  return cachedManifest;
}

export function getChapter(chapterId: string): Chapter | null {
  loadContentFiles();
  return cachedChapters.get(chapterId) ?? null;
}

export function getAllChapters(): Chapter[] {
  loadContentFiles();
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
  loadContentFiles();
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
