export function normalizeText(text) {
  return String(text ?? "").normalize("NFC").trim();
}

export function tokenizeWords(text) {
  const normalized = normalizeText(text);

  if (!normalized) {
    return [];
  }

  return normalized.split(/\s+/u);
}

export function tokenizeCharacters(text) {
  return Array.from(normalizeText(text));
}
