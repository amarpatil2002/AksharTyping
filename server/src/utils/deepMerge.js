export function deepMerge(base, override) {
  if (!override || typeof override !== "object" || Array.isArray(override)) {
    return structuredClone(base);
  }
  const output = structuredClone(base ?? {});
  for (const [key, value] of Object.entries(override)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      output[key] = deepMerge(output[key] ?? {}, value);
    } else {
      output[key] = value;
    }
  }
  return output;
}
