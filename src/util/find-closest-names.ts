/**
 * Returns the known names closest to `name`, for "did you mean" hints in error
 * messages. Matching ignores case and uses the Levenshtein edit distance; only
 * names within `max(2, floor(name.length / 3))` edits are returned, closest
 * first.
 *
 * @param name - The unknown name, as written in the configuration
 * @param knownNames - The names that are registered
 * @param max - The maximum number of suggestions to return
 * @returns Up to `max` known names, closest first; empty when none is close
 */
export function findClosestNames(
  name: string,
  knownNames: readonly string[],
  max = 3
): string[] {
  const lowerName = name.toLowerCase();
  const maxDistance = Math.max(2, Math.floor(name.length / 3));

  return knownNames
    .map(knownName => ({
      knownName,
      distance: levenshtein(lowerName, knownName.toLowerCase()),
    }))
    .filter(({distance}) => distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, max)
    .map(({knownName}) => knownName);
}

/**
 * Formats suggestions from {@link findClosestNames} as a sentence.
 *
 * @param suggestions - The suggested names
 * @returns `Did you mean 'a', 'b'?`, or an empty string when there are no suggestions
 */
export function formatDidYouMean(suggestions: readonly string[]): string {
  if (!suggestions.length) {
    return '';
  }
  return `Did you mean ${suggestions.map(name => `'${name}'`).join(', ')}?`;
}

function levenshtein(a: string, b: string) {
  let previous = Array.from({length: b.length + 1}, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost
      );
    }
    previous = current;
  }
  return previous[b.length];
}
