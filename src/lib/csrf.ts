"use client";

export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

export function getCSRFToken(): string {
  if (typeof window === "undefined") return "";
  let token = sessionStorage.getItem("csrf-token");
  if (!token) {
    token = generateCSRFToken();
    sessionStorage.setItem("csrf-token", token);
  }
  return token;
}

export function addCSRFToOptions(options: RequestInit = {}): RequestInit {
  if (typeof window === "undefined") return options;
  const token = getCSRFToken();
  const headers = new Headers(options.headers);
  headers.set("X-CSRF-Token", token);
  return { ...options, headers };
}

export async function secureFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const secureOptions = addCSRFToOptions(options);

  const response = await fetch(url, secureOptions);

  if (response.status === 419) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error ||
        "CSRF token mismatch. Please refresh the page and try again."
    );
  }

  return response;
}
