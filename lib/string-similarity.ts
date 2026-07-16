/**
 * string-similarity.ts
 * Dependency-free Levenshtein similarity for typo-tolerant Lead matching.
 */

/**
 * Normalizes a string for comparison: trim, lowercase, collapse whitespace.
 */
function normalizeForCompare(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Computes Levenshtein edit distance between two already-normalized strings.
 */
function levenshteinDistance(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  if (a.length === 0) {
    return b.length;
  }
  if (b.length === 0) {
    return a.length;
  }

  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) {
    prev[j] = j;
  }

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost
      );
    }
    for (let j = 0; j <= b.length; j += 1) {
      prev[j] = curr[j];
    }
  }

  return prev[b.length];
}

/**
 * Returns a 0–1 similarity score (1 = identical after normalization).
 */
export function similarity(a: string, b: string): number {
  const left = normalizeForCompare(a);
  const right = normalizeForCompare(b);
  if (left.length === 0 && right.length === 0) {
    return 1;
  }
  const maxLen = Math.max(left.length, right.length);
  if (maxLen === 0) {
    return 1;
  }
  const distance = levenshteinDistance(left, right);
  return 1 - distance / maxLen;
}

/**
 * True when normalized similarity meets the typo-tolerance threshold (default 0.8).
 */
export function isCloseMatch(
  input: string,
  target: string,
  threshold = 0.8
): boolean {
  return similarity(input, target) >= threshold;
}
