// CSRF Protection Utilities

// Generate a random CSRF token
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Get or create CSRF token from session storage
export function getCSRFToken(): string {
  let token = sessionStorage.getItem('csrf-token');
  if (!token) {
    token = generateCSRFToken();
    sessionStorage.setItem('csrf-token', token);
  }
  return token;
}

// Validate CSRF token
export function validateCSRFToken(receivedToken: string): boolean {
  const storedToken = sessionStorage.getItem('csrf-token');
  return storedToken === receivedToken && storedToken !== null;
}

// Add CSRF token to fetch options
export function addCSRFToOptions(options: RequestInit = {}): RequestInit {
  const token = getCSRFToken();
  const headers = new Headers(options.headers);
  
  headers.set('X-CSRF-Token', token);
  
  return {
    ...options,
    headers,
  };
}

// Custom fetch wrapper with CSRF protection
export async function secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const secureOptions = addCSRFToOptions(options);
  
  try {
    const response = await fetch(url, secureOptions);
    
    // Check for CSRF token mismatch response
    if (response.status === 419) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'CSRF token mismatch. Please refresh the page and try again.');
    }
    
    return response;
  } catch (error) {
    // If it's already a custom error, rethrow it
    if (error instanceof Error && error.message.includes('CSRF')) {
      throw error;
    }
    
    // Otherwise wrap it
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
