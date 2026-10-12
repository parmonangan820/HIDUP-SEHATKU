/**
 * Speech Recognition utility to fix Android Chromium / Gboard Speech duplicate transcript bugs.
 * On Android, the speech recognition engine often re-emits cumulative or duplicate sentences
 * (e.g. "saya mau ke carefour saya mau ke carefour saya mau ke carefour").
 */

// Merge speech phrases without repeating overlapping or cumulative text
export function mergeSpeechPhrases(base: string, addition: string): string {
  const b = (base || '').trim();
  const a = (addition || '').trim();
  if (!a) return b;
  if (!b) return a;

  const bLower = b.toLowerCase();
  const aLower = a.toLowerCase();

  // If addition is already contained in base or base ends with addition
  if (bLower === aLower || bLower.endsWith(aLower) || bLower.includes(aLower)) {
    return b;
  }

  // If addition contains the whole base from start (Android cumulative behavior)
  if (aLower.startsWith(bLower)) {
    return a;
  }

  // Check word overlap at the boundary (e.g. b: "...mau ke", a: "ke carefour")
  const bWords = b.split(/\s+/);
  const aWords = a.split(/\s+/);

  let maxOverlap = 0;
  for (let len = Math.min(bWords.length, aWords.length); len >= 1; len--) {
    const bTail = bWords.slice(-len).join(' ').toLowerCase();
    const aHead = aWords.slice(0, len).join(' ').toLowerCase();
    if (bTail === aHead) {
      maxOverlap = len;
      break;
    }
  }

  if (maxOverlap > 0) {
    return (b + ' ' + aWords.slice(maxOverlap).join(' ')).trim();
  }

  return (b + ' ' + a).trim();
}

// Deduplicate repeated consecutive phrases or words (fixes Android Speech Recognition duplication bug:
// e.g. "saya mau ke carefour saya mau ke carefour saya mau ke carefour" -> "saya mau ke carefour")
export function deduplicateRepeatedPhrases(text: string): string {
  if (!text) return '';
  let s = text.replace(/\s+/g, ' ').trim();
  if (!s) return '';

  let modified = true;
  let iterations = 0;
  while (modified && iterations < 15) {
    modified = false;
    iterations++;
    const words = s.split(' ');
    const n = words.length;
    if (n <= 1) break;

    // Check for consecutive identical n-grams (from largest chunk down to 1 word)
    for (let k = Math.floor(n / 2); k >= 1; k--) {
      for (let i = 0; i <= n - 2 * k; i++) {
        const chunk1 = words.slice(i, i + k).join(' ').toLowerCase();
        const chunk2 = words.slice(i + k, i + 2 * k).join(' ').toLowerCase();
        if (chunk1 === chunk2) {
          words.splice(i + k, k);
          s = words.join(' ');
          modified = true;
          break;
        }
      }
      if (modified) break;
    }

    if (!modified) {
      // Check trailing duplicate prefix (e.g. 'saya mau ke carefour saya mau')
      const currentWords = s.split(' ');
      const len = currentWords.length;
      for (let k = Math.floor(len / 2); k >= 1; k--) {
        const head = currentWords.slice(0, k).join(' ').toLowerCase();
        const tail = currentWords.slice(len - k).join(' ').toLowerCase();
        if (head === tail) {
          currentWords.splice(len - k, k);
          s = currentWords.join(' ');
          modified = true;
          break;
        }
      }
    }
  }

  return s.trim();
}

// Clean spoken text: normalize whitespace and deduplicate repeated phrases
export function cleanSpokenText(text: string): string {
  if (!text) return '';
  return deduplicateRepeatedPhrases(text);
}
