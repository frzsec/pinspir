import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { rewardLedger, playthroughAttempts } from '@/db/schema/gameplay';
import { playerProjections } from '@/db/schema/projections';

type TransactionClient = {
  select: typeof db.select;
  insert: typeof db.insert;
  update: typeof db.update;
  delete: typeof db.delete;
};

export async function rebuildPlayerProjection(
  txOrUserId: TransactionClient | string,
  maybeUserId?: string
): Promise<{
  totalXp: number;
  totalStars: number;
  totalCoins: number;
  completedChapters: string[];
}> {
  const client = typeof txOrUserId === 'object' && txOrUserId !== null && 'select' in txOrUserId
    ? (txOrUserId as unknown as typeof db)
    : db;
  const userId = typeof txOrUserId === 'string' ? txOrUserId : maybeUserId!;

  // 1. Calculate XP sum
  const xpRes = await client
    .select({
      total: sql<string>`coalesce(sum(${rewardLedger.amount}), 0)`,
    })
    .from(rewardLedger)
    .where(
      sql`${rewardLedger.userId} = ${userId} AND ${rewardLedger.rewardType} = 'xp'`
    );

  // 2. Calculate Star sum
  const starRes = await client
    .select({
      total: sql<string>`coalesce(sum(${rewardLedger.amount}), 0)`,
    })
    .from(rewardLedger)
    .where(
      sql`${rewardLedger.userId} = ${userId} AND ${rewardLedger.rewardType} = 'star'`
    );

  // 3. Calculate Coin sum
  const coinRes = await client
    .select({
      total: sql<string>`coalesce(sum(${rewardLedger.amount}), 0)`,
    })
    .from(rewardLedger)
    .where(
      sql`${rewardLedger.userId} = ${userId} AND ${rewardLedger.rewardType} = 'coin'`
    );

  const totalXp = Number(xpRes[0]?.total ?? 0);
  const totalStars = Number(starRes[0]?.total ?? 0);
  const totalCoins = Number(coinRes[0]?.total ?? 0);

  // 4. Completed chapters
  const completedRes = await client
    .select({
      chapterId: playthroughAttempts.chapterId,
    })
    .from(playthroughAttempts)
    .where(
      sql`${playthroughAttempts.userId} = ${userId} AND ${playthroughAttempts.status} = 'completed'`
    );

  const completedChapters = Array.from(
    new Set(completedRes.map((r: { chapterId: string }) => r.chapterId))
  ) as string[];

  // 5. Update or insert player_projections
  await client
    .insert(playerProjections)
    .values({
      userId,
      totalXp,
      totalStars,
      completedChapters,
      lastActivityAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: playerProjections.userId,
      set: {
        totalXp,
        totalStars,
        completedChapters,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      },
    });

  return {
    totalXp,
    totalStars,
    totalCoins,
    completedChapters,
  };
}
