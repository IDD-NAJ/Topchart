import { NextRequest, NextResponse } from "next/server";

// CSRF Protection Middleware
export function withCSRFProtection(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Only protect state-changing methods
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const csrfToken = req.headers.get('X-CSRF-Token');
      
      if (!csrfToken) {
        return NextResponse.json(
          { success: false, error: 'CSRF token missing' },
          { status: 419 }
        );
      }
      
      // For demo purposes, we'll just check if the token exists and looks valid
      // In production, you'd validate against a session-stored token
      if (!isValidCSRFToken(csrfToken)) {
        return NextResponse.json(
          { success: false, error: 'Invalid CSRF token' },
          { status: 419 }
        );
      }
    }
    
    return handler(req);
  };
}

// Simple validation - in production, validate against session storage
function isValidCSRFToken(token: string): boolean {
  // Basic validation: should be a 64-character hex string
  return /^[a-f0-9]{64}$/i.test(token);
}

// Helper to set CSRF token in response headers
export function setCSRFToken(response: NextResponse): void {
  const token = generateCSRFToken();
  response.headers.set('X-CSRF-Token', token);
}

function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
