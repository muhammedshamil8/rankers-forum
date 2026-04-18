const NON_DIGIT_REGEX = /\D/g;

/**
 * Normalize a phone input by trimming spacing/punctuation while preserving an optional leading +.
 */
export function normalizePhoneNumber(input: string): string {
  const value = input.trim();

  if (!value) {
    return '';
  }

  const digits = value.replace(NON_DIGIT_REGEX, '');

  if (!digits) {
    return '';
  }

  if (value.startsWith('+') || value.startsWith('00')) {
    return `+${digits}`;
  }

  return digits;
}

/**
 * Validates international-style phone numbers containing 10 to 15 digits.
 */
export function isValidPhoneNumber(input: string): boolean {
  const normalized = normalizePhoneNumber(input);

  if (!normalized) {
    return false;
  }

  const digits = normalized.replace(NON_DIGIT_REGEX, '');
  return digits.length >= 10 && digits.length <= 15 && !digits.startsWith('0');
}

/**
 * Produce likely storage variants so older and newer phone formats can both be found.
 */
export function getPhoneLookupVariants(input: string): string[] {
  const normalized = normalizePhoneNumber(input);

  if (!normalized) {
    return [];
  }

  const digits = normalized.replace(NON_DIGIT_REGEX, '');
  const variants = new Set<string>();

  variants.add(normalized);
  variants.add(digits);
  variants.add(`+${digits}`);

  return Array.from(variants);
}