import { describe, it, expect } from 'vitest';
import { getCryptoRandomInt, selectCryptoRandomItem, selectCryptoUniqueItems } from '../electron/cryptoRandom';

describe('Cryptographic Fair Random Selector', () => {
  it('should generate crypto random integers within [min, max) without bias', () => {
    const min = 0;
    const max = 10;
    const counts: Record<number, number> = {};

    for (let i = 0; i < 1000; i++) {
      const val = getCryptoRandomInt(min, max);
      expect(val).toBeGreaterThanOrEqual(min);
      expect(val).toBeLessThan(max);
      counts[val] = (counts[val] || 0) + 1;
    }

    // Every number from 0 to 9 should have been chosen at least once in 1000 trials
    for (let i = 0; i < 10; i++) {
      expect(counts[i]).toBeGreaterThan(0);
    }
  });

  it('should throw an error if min >= max', () => {
    expect(() => getCryptoRandomInt(10, 10)).toThrow();
    expect(() => getCryptoRandomInt(12, 5)).toThrow();
  });

  it('should select exactly 12 unique eligible teams from a pool of 24 teams', () => {
    const teams = Array.from({ length: 24 }, (_, idx) => ({
      id: `team-${idx + 1}`,
      name: `Team ${idx + 1}`
    }));

    const selected = selectCryptoUniqueItems(teams, 12);

    expect(selected.length).toBe(12);

    // Verify all 12 are unique
    const uniqueIds = new Set(selected.map(t => t.id));
    expect(uniqueIds.size).toBe(12);

    // Verify all selected belong to original pool
    selected.forEach(t => {
      expect(teams.some(orig => orig.id === t.id)).toBe(true);
    });
  });

  it('should prevent repeated selections within the same draw', () => {
    const teams = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    const selected = selectCryptoUniqueItems(teams, 12);

    const set = new Set(selected);
    expect(set.size).toBe(12);
  });

  it('should handle fewer than 12 eligible teams by failing rather than fabricating teams', () => {
    const smallPool = ['Team 1', 'Team 2', 'Team 3'];

    // If requested count exceeds available pool, it must error and NOT fabricate fake teams
    expect(() => selectCryptoUniqueItems(smallPool, 12)).toThrow(/Cannot select 12 items from pool of 3/);
  });
});
