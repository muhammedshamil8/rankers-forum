import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function cleanCommas(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .toString()
    .replace(/,+/g, ',')           
    .replace(/,\s*,/g, ',')        
    .replace(/\s+,\s+/g, ', ')     
    .replace(/\s*,\s*/g, ', ')     
    .replace(/,\s*$/g, '')         
    .replace(/^\s*,/g, '')         
    .trim();
}
