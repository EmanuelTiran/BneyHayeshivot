// Quote every cell and neutralize spreadsheet formulas, including control prefixes.
export function csvCell(value) {
  const raw = String(value ?? '');
  // Strip control prefixes only for detection; preserve the original cell text.
  const formulaText = [...raw].filter(char => char.charCodeAt(0) > 31).join('').trimStart();
  const safe = /^[=+\-@]/.test(formulaText) || /^[\t\r\n]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}
