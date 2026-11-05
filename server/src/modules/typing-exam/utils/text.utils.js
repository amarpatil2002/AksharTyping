export function normalizeText(text, normalization = 'NFC') {
  const value = String(text ?? '');
  return normalization === 'NONE' ? value : value.normalize(normalization);
}

export function tokenizeWords(text) {
  return String(text ?? '').trim().split(/\s+/u).filter(Boolean);
}

export function countCodePoints(text) {
  return Array.from(String(text ?? '')).length;
}

export function countGraphemes(text) {
  const value = String(text ?? '');
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    return [...segmenter.segment(value)].length;
  }
  return Array.from(value).length;
}

export function countCharacters(text, unit = 'GRAPHEME_CLUSTERS') {
  if (unit === 'UTF16_CODE_UNITS') return String(text ?? '').length;
  if (unit === 'UNICODE_CODE_POINTS') return countCodePoints(text);
  if (unit === 'GRAPHEME_CLUSTERS') return countGraphemes(text);
  return 0;
}
