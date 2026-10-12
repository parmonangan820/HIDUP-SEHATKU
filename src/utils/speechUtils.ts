/**
 * Speech Recognition utility to fix Android Chromium / Gboard Speech duplicate transcript bugs.
 * On Android, the speech recognition engine often re-emits cumulative or duplicate sentences
 * (e.g. "saya mau ke carefour saya mau ke carefour saya mau ke carefour").
 */

// Normalize token for comparison (remove punctuation, lower case)
function normToken(token: string): string {
  return (token || '').toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
}

// Check if two sequences of tokens are identical ignoring punctuation and case
function areTokenSequencesEqual(seq1: string[], seq2: string[]): boolean {
  if (seq1.length !== seq2.length) return false;
  for (let i = 0; i < seq1.length; i++) {
    if (normToken(seq1[i]) !== normToken(seq2[i])) return false;
  }
  return true;
}

// Deduplicate repeated consecutive phrases, sentences, or n-grams
export function deduplicateRepeatedPhrases(text: string): string {
  if (!text) return '';
  let s = text.replace(/\s+/g, ' ').trim();
  if (!s) return '';

  // 1. Direct whole-string repeating check (e.g. "X X X" or "X, X, X" or "X. X. X")
  const splitPunct = s.split(/\s*[,.;?!]+\s*/).map((p) => p.trim()).filter(Boolean);
  if (splitPunct.length > 1) {
    const firstPunct = splitPunct[0].toLowerCase();
    const allSame = splitPunct.every((p) => p.toLowerCase() === firstPunct);
    if (allSame) {
      s = splitPunct[0];
    }
  }

  // 2. Token-level N-gram deduplication (from largest half down to 1 token)
  let modified = true;
  let iterations = 0;
  while (modified && iterations < 25) {
    modified = false;
    iterations++;

    const words = s.split(' ').filter(Boolean);
    const n = words.length;
    if (n <= 1) break;

    // Check for consecutive identical n-grams (from chunk size n/2 down to 1)
    for (let k = Math.floor(n / 2); k >= 1; k--) {
      for (let i = 0; i <= n - 2 * k; i++) {
        const chunk1 = words.slice(i, i + k);
        const chunk2 = words.slice(i + k, i + 2 * k);

        if (areTokenSequencesEqual(chunk1, chunk2)) {
          // Splice out the duplicate chunk2
          words.splice(i + k, k);
          s = words.join(' ');
          modified = true;
          break;
        }
      }
      if (modified) break;
    }

    if (!modified) {
      // Check for partial trailing duplicate (e.g. "saya mau ke carefour saya mau")
      const currentWords = s.split(' ').filter(Boolean);
      const len = currentWords.length;
      for (let k = Math.floor(len / 2); k >= 1; k--) {
        const head = currentWords.slice(0, k);
        const tail = currentWords.slice(len - k);
        if (areTokenSequencesEqual(head, tail)) {
          currentWords.splice(len - k, k);
          s = currentWords.join(' ');
          modified = true;
          break;
        }
      }
    }
  }

  // 3. Clean up trailing/leading punctuation artifacts
  s = s.replace(/\s*[,;]+\s*$/, '').trim();
  return s;
}

// Merge speech phrases without repeating overlapping or cumulative text
export function mergeSpeechPhrases(base: string, addition: string): string {
  const b = (base || '').trim();
  const a = (addition || '').trim();
  if (!a) return b;
  if (!b) return a;

  const bClean = deduplicateRepeatedPhrases(b);
  const aClean = deduplicateRepeatedPhrases(a);

  const bLower = bClean.toLowerCase();
  const aLower = aClean.toLowerCase();

  // If addition is already contained in base
  if (bLower === aLower || bLower.endsWith(aLower) || bLower.includes(aLower)) {
    return bClean;
  }

  // If addition contains the whole base from start (Android cumulative behavior)
  if (aLower.startsWith(bLower)) {
    return aClean;
  }

  // Check word overlap at the boundary
  const bWords = bClean.split(/\s+/).filter(Boolean);
  const aWords = aClean.split(/\s+/).filter(Boolean);

  let maxOverlap = 0;
  for (let len = Math.min(bWords.length, aWords.length); len >= 1; len--) {
    const bTail = bWords.slice(-len);
    const aHead = aWords.slice(0, len);
    if (areTokenSequencesEqual(bTail, aHead)) {
      maxOverlap = len;
      break;
    }
  }

  let result = '';
  if (maxOverlap > 0) {
    result = (bClean + ' ' + aWords.slice(maxOverlap).join(' ')).trim();
  } else {
    // If not overlapping, check if a is already a substring of b or vice versa
    const bTokensNorm = bWords.map(normToken).join(' ');
    const aTokensNorm = aWords.map(normToken).join(' ');
    if (bTokensNorm.includes(aTokensNorm)) {
      return bClean;
    }
    if (aTokensNorm.includes(bTokensNorm)) {
      return aClean;
    }
    result = (bClean + ' ' + aClean).trim();
  }

  return deduplicateRepeatedPhrases(result);
}

// Clean spoken text: normalize whitespace and deduplicate repeated phrases
export function cleanSpokenText(text: string): string {
  if (!text) return '';
  return deduplicateRepeatedPhrases(text);
}
