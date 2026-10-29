import crypto from 'crypto';

/**
 * Cryptographically fair random selection using Node.js crypto.randomInt
 * Generates an integer uniformly distributed in [min, max).
 */
export function getCryptoRandomInt(min: number, max: number): number {
  if (min >= max) {
    throw new Error(`Invalid range: min (${min}) must be less than max (${max})`);
  }
  return crypto.randomInt(min, max);
}

/**
 * Selects a cryptographically fair random item from an array
 */
export function selectCryptoRandomItem<T>(items: T[]): { item: T; index: number } {
  if (!items || items.length === 0) {
    throw new Error('Cannot select from an empty array');
  }
  const index = getCryptoRandomInt(0, items.length);
  return { item: items[index], index };
}

/**
 * Selects exactly N unique items uniformly from an array without replacement
 * using Node.js cryptographic randomness.
 */
export function selectCryptoUniqueItems<T>(items: T[], count: number): T[] {
  if (count <= 0) return [];
  if (items.length < count) {
    throw new Error(`Cannot select ${count} items from pool of ${items.length}`);
  }

  const pool = [...items];
  const selected: T[] = [];

  for (let i = 0; i < count; i++) {
    const randomIndex = getCryptoRandomInt(0, pool.length);
    selected.push(pool[randomIndex]);
    pool.splice(randomIndex, 1);
  }

  return selected;
}
