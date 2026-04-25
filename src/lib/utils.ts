import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shouldUseSecureCookies(): boolean {
  if (process.env.NODE_ENV === "development") return false;
  return process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") === true;
}

export async function safeJson<T = any>(response: Response): Promise<T | null> {
  try {
    return await response.json() as T;
  } catch {
    return null;
  }
}
