"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { type User as ServerUser } from "@/lib/actions/auth";
import { isAdmin as checkIsAdmin } from "@/lib/roles";
import { InactivityWarningModal } from "@/components/inactivity-warning-modal";

const INACTIVITY_TIMEOUT = 5 * 60 * 1000;
const WARNING_BEFORE_LOGOUT = 60 * 1000;

type MePayload = { success?: boolean; user?: ServerUser };

type MeFetchResult =
  | { kind: "ok"; status: number; payload: MePayload | null }
  | { kind: "network" };

let _meInFlight: Promise<MeFetchResult> | null = null;

function invalidateMeRequest() {
  _meInFlight = null;
}

async function fetchMeOnce(): Promise<MeFetchResult> {
  try {
    const response = await fetch("/api/auth/me", {
      credentials: "include",
      cache: "no-store",
    });
    let payload: MePayload | null = null;
    try {
      payload = (await response.json()) as MePayload;
    } catch {
      payload = null;
    }
    return { kind: "ok", status: response.status, payload };
  } catch {
    return { kind: "network" };
  }
}

function fetchMe(): Promise<MeFetchResult> {
  if (!_meInFlight) {
    _meInFlight = fetchMeOnce().finally(() => {
      _meInFlight = null;
    });
  }
  return _meInFlight;
}

// Fetch NextAuth session
async function fetchNextAuthSession(): Promise<User | null> {
  try {
    const response = await fetch("/api/auth/session", {
      credentials: "include",
      cache: "no-store",
    });
    const session = await response.json();
    if (session?.user?.id) {
      return {
        id: session.user.id,
        email: session.user.email,
        firstName: session.user.firstName || session.user.name?.split(' ')[0] || '',
        lastName: session.user.lastName || session.user.name?.split(' ').slice(1).join(' ') || '',
        phone: session.user.phone || '',
        walletBalance: session.user.walletBalance || 0,
        isVerified: session.user.isVerified || false,
        role: session.user.role || 'USER',
        createdAt: session.user.createdAt || new Date().toISOString(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  walletBalance: number;
  isVerified: boolean;
  role?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  initialized: boolean;
  showPreload: boolean;
  /** True when user.role === 'ADMIN' */
  isAdmin: boolean;
  /** True when user.role === 'USER' or unset */
  isUser: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; user?: User }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateBalance: (newBalance: number) => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  referralCode?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapServerUser(serverUser: ServerUser): User {
  return {
    id: serverUser.id,
    email: serverUser.email,
    firstName: serverUser.first_name,
    lastName: serverUser.last_name,
    phone: serverUser.phone,
    walletBalance: Number(serverUser.wallet_balance),
    isVerified: Boolean(serverUser.is_verified),
    role: (serverUser as any).role,
    createdAt: serverUser.created_at,
  };
}

const MIN_PRELOAD_DURATION = 2500;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [showPreload, setShowPreload] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const router = useRouter();
  const pathname = usePathname();
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const authCompleteRef = useRef(false);
  const refreshSequenceRef = useRef(0);

  const invalidateAuthState = useCallback(() => {
    refreshSequenceRef.current += 1;
    invalidateMeRequest();
  }, []);

  const refreshUser = useCallback(async () => {
    const requestId = ++refreshSequenceRef.current;

    try {
      // First try legacy session
      const result = await fetchMe();
      if (requestId !== refreshSequenceRef.current) return;
      if (result.kind === "network") {
        return;
      }
      if (result.status >= 200 && result.status < 300) {
        const body = result.payload;
        if (body?.success && body.user) {
          if (requestId !== refreshSequenceRef.current) return;
          setUser(mapServerUser(body.user));
          return;
        }
      }
      
      // If no legacy session, try NextAuth session
      const nextAuthUser = await fetchNextAuthSession();
      if (requestId !== refreshSequenceRef.current) return;
      if (nextAuthUser) {
        setUser(nextAuthUser);
        return;
      }

      if (requestId !== refreshSequenceRef.current) return;
      setUser(null);
    } catch (error) {
      if (error instanceof Error &&
          (error.name === "TypeError" ||
            error.name === "NetworkError" ||
            error.message?.includes("fetch") ||
            error.message?.includes("network"))) {
        return;
      }
      console.error("Error refreshing user:", error);
      if (requestId !== refreshSequenceRef.current) return;
      setUser(null);
    }
  }, [invalidateAuthState]);

  useEffect(() => {
    // Only refresh user on mount, not on every render
    let mounted = true;

    console.log('[Auth] Initializing auth provider');

    // Show preload on initial load
    setShowPreload(true);
    authCompleteRef.current = false;

    refreshUser().then(() => {
      if (mounted) {
        console.log('[Auth] Auth refresh completed, setting initialized=true');
        setIsLoading(false);
        setInitialized(true);
        authCompleteRef.current = true;

        // Clear auth_loading cookie after auth initialization completes
        document.cookie = 'auth_loading=; path=/; max-age=0; SameSite=Lax' + (process.env.NODE_ENV === 'production' ? '; domain=.topchart.store' : '');

        // Hide preload after minimum duration
        setTimeout(() => {
          setShowPreload(false);
        }, MIN_PRELOAD_DURATION);
      }
    }).catch((error) => {
      console.error('[Auth] Auth refresh failed:', error);
      if (mounted) {
        setIsLoading(false);
        setInitialized(true);
        authCompleteRef.current = true;

        // Clear auth_loading cookie even on error
        document.cookie = 'auth_loading=; path=/; max-age=0; SameSite=Lax' + (process.env.NODE_ENV === 'production' ? '; domain=.topchart.store' : '');

        // Hide preload after minimum duration even on error
        setTimeout(() => {
          setShowPreload(false);
        }, MIN_PRELOAD_DURATION);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleAuthChanged = () => {
      invalidateAuthState();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("auth:changed", handleAuthChanged);
      return () => window.removeEventListener("auth:changed", handleAuthChanged);
    }
  }, [invalidateAuthState]);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      // Normalize email to lowercase for case-insensitive authentication
      const normalizedEmail = email.toLowerCase();
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      const result = await response.json();

      if (result.success && result.user && result.token && result.expiresAt) {
        invalidateAuthState();
        const u = mapServerUser(result.user);
        setUser(u);
        return { success: true, user: u };
      }

      return { success: false, error: result.error || "Login failed" };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

const register = async (
      data: RegisterData
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const requestBody = {
          email: data.email.toLowerCase(),
          password: data.password,
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          referralCode: data.referralCode,
        };
        
        console.log("Auth-context register request for:", data.email.toLowerCase());
        
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(requestBody),
        });
        
        console.log("Auth-context register response status:", response.status);
        
        const result = await response.json();
        
        console.log("Auth-context register response status:", response.status);

        if (result.success && result.user) {
          invalidateAuthState();
          setUser(mapServerUser(result.user));
          return { success: true };
        }

        return { success: false, error: result.error || "Registration failed" };
      } catch (error) {
        console.error("Registration error:", error);
        return { success: false, error: "An unexpected error occurred" };
      }
    };

  const logout = useCallback(async () => {
    try {
      invalidateAuthState();
      // Sign out from NextAuth
      await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
      
      // Use API route so we can logout without server redirects
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        keepalive: true,
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
    }
  }, [invalidateAuthState]);

  // Inactivity tracking - Auto logout after 5 minutes
  const clearAllTimers = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const handleLogout = useCallback(async () => {
    clearAllTimers();
    setShowWarning(false);
    await logout();
    router.push('/login?reason=inactive');
  }, [clearAllTimers, logout, router]);

  const resetInactivityTimer = useCallback(() => {
    if (!user) return;
    
    lastActivityRef.current = Date.now();
    clearAllTimers();
    setShowWarning(false);

    // Set warning timer (show warning 60 seconds before logout)
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setSecondsRemaining(60);
      
      // Start countdown
      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE_LOGOUT);

    // Set logout timer
    inactivityTimerRef.current = setTimeout(() => {
      handleLogout();
    }, INACTIVITY_TIMEOUT);
  }, [user, clearAllTimers, handleLogout]);

  // Setup activity listeners
  useEffect(() => {
    if (!user) {
      clearAllTimers();
      setShowWarning(false);
      return;
    }

    if (typeof window === "undefined") return;

    const activityEvents = ['keydown', 'scroll'];
    
    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Add event listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Start initial timer
    resetInactivityTimer();

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearAllTimers();
    };
  }, [user, resetInactivityTimer, clearAllTimers]);

  // Don't track inactivity on auth pages
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register');
  const shouldShowWarning = showWarning && !!user && !isAuthPage;

  const updateBalance = (newBalance: number) => {
    if (!user) return;
    setUser({ ...user, walletBalance: newBalance });
  };

  const isAdmin = checkIsAdmin(user?.role);
  const isUser = !isAdmin && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        initialized,
        showPreload,
        isAdmin,
        isUser,
        login,
        register,
        logout,
        updateBalance,
        refreshUser,
      }}
    >
      {children}
      <InactivityWarningModal
        isOpen={shouldShowWarning}
        secondsRemaining={secondsRemaining}
        onStayActive={resetInactivityTimer}
        onLogout={handleLogout}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
