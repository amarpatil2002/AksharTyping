export function roundTo(value, decimalPlaces = 2, method = 'ROUND') {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimalPlaces;
  if (method === 'FLOOR') return Math.floor(value * factor) / factor;
  if (method === 'CEIL') return Math.ceil(value * factor) / factor;
  if (method === 'TRUNCATE') return Math.trunc(value * factor) / factor;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function safeDivide(numerator, denominator) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return 0;
  return numerator / denominator;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
