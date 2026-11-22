/**
 * CMS list field from an enabled section.
 * - Section missing/disabled → [] (do not resurrect hardcoded seed copy)
 * - Section enabled with empty/missing list → []
 * - Section enabled with items → those items
 */
export function cmsList(sec, key) {
  if (!sec) return [];
  const value = sec.fields?.[key];
  return Array.isArray(value) ? value : [];
}
