const ISO_6346_PATTERN = /^[A-Z]{4}\d{7}$/;
const DEMO_PATTERN = /^DRAY\d{7}$/;

export interface ValidationResult {
  valid: string[];
  invalid: string[];
  duplicatesRemoved: number;
}

export function parseContainerInput(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s.length > 0);
}

export function isValidContainer(container: string): boolean {
  return ISO_6346_PATTERN.test(container) || DEMO_PATTERN.test(container);
}

export function validateContainers(containers: string[]): ValidationResult {
  const seen = new Set<string>();
  const valid: string[] = [];
  const invalid: string[] = [];
  let duplicatesRemoved = 0;

  for (const c of containers) {
    if (seen.has(c)) {
      duplicatesRemoved++;
      continue;
    }
    seen.add(c);

    if (isValidContainer(c)) {
      valid.push(c);
    } else {
      invalid.push(c);
    }
  }

  return { valid, invalid, duplicatesRemoved };
}
