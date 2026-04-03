import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shouldUseSecureCookies(): boolean {
  // Only mark cookies as Secure when served over HTTPS.
  // This prevents localhost HTTP from silently dropping auth cookies.
  if (process.env.NODE_ENV === "development") return false;
  return process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") === true;
}
