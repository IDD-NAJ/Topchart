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

async function fetchMeOnce(): Promise<MeFetchResult> {
  try {
    const response = await fetch("/api/auth/me", { credentials: "include" });
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const router = useRouter();
  const pathname = usePathname();
  const logoutInFlightRef = useRef(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const refreshUser = useCallback(async () => {
    try {
      const result = await fetchMe();
      if (result.kind === "network") {
        console.warn("Network error during user refresh");
        return;
      }
      if (result.status >= 200 && result.status < 300) {
        const body = result.payload;
        if (body?.success && body.user) {
          setUser(mapServerUser(body.user));
        } else {
          setUser(null);
        }
        return;
      }
      if (result.status !== 401) {
        console.error("Failed to refresh user:", result.status);
      }
      setUser(null);
    } catch (error) {
      if (error instanceof Error &&
          (error.name === "TypeError" ||
            error.name === "NetworkError" ||
            error.message?.includes("fetch") ||
            error.message?.includes("network"))) {
        console.warn("Network error during user refresh:", error);
        return;
      }
      console.error("Failed to refresh user:", error);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // Only refresh user on mount, not on every render
    let mounted = true;
    
    refreshUser().then(() => {
      if (mounted) {
        setIsLoading(false);
      }
    }).catch(() => {
      if (mounted) {
        setIsLoading(false);
      }
    });
    
    return () => {
      mounted = false;
    };
  }, [refreshUser]);

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

      if (result.success && result.user) {
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
        
        console.log("Auth-context register request:", JSON.stringify(requestBody, null, 2));
        
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
        
        console.log("Auth-context register response:", JSON.stringify(result, null, 2));

        if (result.success && result.user) {
          setUser(mapServerUser(result.user));
          return { success: true };
        }

        return { success: false, error: result.error || "Registration failed" };
      } catch (error) {
        console.error("Registration error:", error);
        return { success: false, error: "An unexpected error occurred" };
      }
    };

  const logout = async () => {
    try {
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
  };

  // Inactivity tracking - Auto logout after 30 minutes
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

    // Set warning timer (show warning 30 seconds before logout)
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setSecondsRemaining(30);
      
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

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'mousemove'];
    
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
