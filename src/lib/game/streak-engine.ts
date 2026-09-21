/**
 * Menghitung streak pemain berdasarkan tanggal bisnis Asia/Jakarta (WIB).
 */
export function calculateStreak(
  currentStreak: number,
  longestStreak: number,
  lastActivityDate: string | null,
  todayWib: string
): {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  isNewDay: boolean;
} {
  if (lastActivityDate === todayWib) {
    return {
      currentStreak,
      longestStreak,
      lastActivityDate,
      isNewDay: false,
    };
  }

  if (!lastActivityDate) {
    return {
      currentStreak: 1,
      longestStreak: Math.max(1, longestStreak),
      lastActivityDate: todayWib,
      isNewDay: true,
    };
  }

  // Parse YYYY-MM-DD
  const [tYear, tMonth, tDay] = todayWib.split('-').map(Number);
  const [lYear, lMonth, lDay] = lastActivityDate.split('-').map(Number);

  const todayUtc = Date.UTC(tYear, tMonth - 1, tDay);
  const lastUtc = Date.UTC(lYear, lMonth - 1, lDay);

  const diffDays = Math.round((todayUtc - lastUtc) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    const nextStreak = currentStreak + 1;
    return {
      currentStreak: nextStreak,
      longestStreak: Math.max(nextStreak, longestStreak),
      lastActivityDate: todayWib,
      isNewDay: true,
    };
  }

  // Broken streak or first activity
  return {
    currentStreak: 1,
    longestStreak: Math.max(1, longestStreak),
    lastActivityDate: todayWib,
    isNewDay: true,
  };
}
