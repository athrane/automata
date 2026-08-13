/**
 * Selects `count` distinct rule-preset indices at random.
 *
 * Uses a partial Fisher–Yates shuffle over the index range `[0, total)` and
 * returns the first `count` entries. The random source is injected so callers
 * (and tests) can supply a deterministic generator.
 *
 * @param total - Number of available presets.
 * @param count - Number of indices to select.
 * @param random - Random source returning a value in `[0, 1)`.
 * @returns Distinct indices in `[0, total)`; every index when `count >= total`,
 *          and an empty array when `count <= 0` or `total <= 0`.
 */
export function selectRandomPresetIndices(
  total: number,
  count: number,
  random: () => number,
): number[] {
  if (total <= 0) return [];
  if (count <= 0) return [];

  const indices: number[] = [];
  for (let i = 0; i < total; i += 1) {
    indices.push(i);
  }

  if (count >= total) return indices;

  for (let i = 0; i < count; i += 1) {
    const swapIndex = i + Math.floor(random() * (total - i));
    const current = indices[i];
    indices[i] = indices[swapIndex];
    indices[swapIndex] = current;
  }

  return indices.slice(0, count);
}
