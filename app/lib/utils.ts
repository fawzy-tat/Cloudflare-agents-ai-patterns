import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a short random session ID
 * Can be used on both server and client
 */
export function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 8);
}
