import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Clean redundant commas and spaces from strings
 */
export function cleanCommas(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .toString()
    .replace(/,+/g, ',')           // Replace multiple commas with one
    .replace(/,\s*,/g, ',')        // Handle commas separated by space
    .replace(/\s+,\s+/g, ', ')     // Normalize space around commas
    .replace(/\s*,\s*/g, ', ')     // Ensure space after comma
    .replace(/,\s*$/g, '')         // Remove trailing comma
    .replace(/^\s*,/g, '')         // Remove leading comma
    .trim();
}
