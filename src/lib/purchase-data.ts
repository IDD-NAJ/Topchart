/**
 * Unified data fetching for airtime and data bundle purchases
 * Handles caching, real-time pricing, and error handling
 */

import { useState, useEffect, useCallback } from "react";

// Types
export interface Network {
  id: string;
  name: string;
  code: string;
  logo: string;
  color: string;
  phonePrefixes: string[];
}

export interface DataBundle {
  id: string;
  name: string;
  networkId: string;
  dataAmount: string;
  validity: string;
  price: number;
  originalPrice?: number;
  category: "daily" | "weekly" | "monthly" | "night" | "social" | "other";
  isPopular?: boolean;
  isNew?: boolean;
  description?: string;
}

export interface RecentRecipient {
  id: string;
  phoneNumber: string;
  networkId: string;
  lastUsed: string;
  usageCount: number;
}

//  networks configuration
export const _NETWORKS: Network[] = [
  {
    id: "mtn",
    name: "MTN",
    code: "MTN",
    logo: "/networks/mtn.svg",
    color: "#FFD700",
    phonePrefixes: ["024", "025", "054", "055", "059"],
  },
  {
    id: "vodafone",
    name: "Vodafone",
    code: "VODAFONE",
    logo: "/networks/vodafone.svg",
    color: "#E60000",
    phonePrefixes: ["020", "050"],
  },
  {
    id: "airteltigo",
    name: "AirtelTigo",
    code: "AIRTELTIGO",
    logo: "/networks/airteltigo.svg",
    color: "#0066CC",
    phonePrefixes: ["026", "027", "056", "057"],
  },
];

// Detect network from phone number
export function detectNetwork(phoneNumber: string): Network | null {
  const cleanNumber = phoneNumber.replace(/\D/g, "");
  const prefix = cleanNumber.slice(0, 3);
  
  return _NETWORKS.find((network) =>
    network.phonePrefixes.includes(prefix)
  ) || null;
}

// Format phone number for display
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
  }
  if (cleaned.length === 9) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
  }
  return phone;
}

// Cache keys for localStorage
const CACHE_KEYS = {
  bundles: "tc_bundles",
  bundlesTimestamp: "tc_bundles_ts",
  recipients: "tc_recipients",
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Fetch data bundles with caching
export async function fetchDataBundles(
  networkId?: string
): Promise<{ bundles: DataBundle[]; fromCache: boolean }> {
  // Check cache first
  const cached = localStorage.getItem(CACHE_KEYS.bundles);
  const cachedTimestamp = localStorage.getItem(CACHE_KEYS.bundlesTimestamp);
  
  if (cached && cachedTimestamp) {
    const age = Date.now() - parseInt(cachedTimestamp, 10);
    if (age < CACHE_TTL) {
      const allBundles: DataBundle[] = JSON.parse(cached);
      return {
        bundles: networkId 
          ? allBundles.filter((b) => b.networkId === networkId)
          : allBundles,
        fromCache: true,
      };
    }
  }

  // Fetch from API
  try {
    const url = networkId 
      ? `/api/purchases/plans?network=${networkId}`
      : "/api/purchases/plans";
    
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch bundles");
    
    const data = await response.json();
    const bundles: DataBundle[] = data.bundles || data.plans || [];
    
    // Cache results
    localStorage.setItem(CACHE_KEYS.bundles, JSON.stringify(bundles));
    localStorage.setItem(CACHE_KEYS.bundlesTimestamp, Date.now().toString());
    
    return { bundles, fromCache: false };
  } catch (error) {
    console.error("Failed to fetch data bundles:", error);
    throw error;
  }
}

// Hook for data bundles with auto-refresh
export function useDataBundles(networkId?: string) {
  const [bundles, setBundles] = useState<DataBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchDataBundles(networkId);
      setBundles(result.bundles);
      setFromCache(result.fromCache);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bundles");
    } finally {
      setLoading(false);
    }
  }, [networkId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { bundles, loading, error, fromCache, refresh };
}

// Get recent recipients from localStorage
export function getRecentRecipients(): RecentRecipient[] {
  const stored = localStorage.getItem(CACHE_KEYS.recipients);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Add/update recipient in recent list
export function addRecentRecipient(
  phoneNumber: string,
  networkId: string
): void {
  const recipients = getRecentRecipients();
  const existingIndex = recipients.findIndex(
    (r) => r.phoneNumber === phoneNumber
  );
  
  if (existingIndex >= 0) {
    // Update existing
    recipients[existingIndex].lastUsed = new Date().toISOString();
    recipients[existingIndex].usageCount++;
  } else {
    // Add new
    recipients.unshift({
      id: crypto.randomUUID(),
      phoneNumber,
      networkId,
      lastUsed: new Date().toISOString(),
      usageCount: 1,
    });
  }
  
  // Keep only top 10
  const trimmed = recipients.slice(0, 10);
  localStorage.setItem(CACHE_KEYS.recipients, JSON.stringify(trimmed));
}

// Categorize bundles
export function categorizeBundles(bundles: DataBundle[]): Record<string, DataBundle[]> {
  const categories: Record<string, DataBundle[]> = {
    daily: [],
    weekly: [],
    monthly: [],
    night: [],
    social: [],
    other: [],
  };
  
  bundles.forEach((bundle) => {
    const cat = bundle.category || "other";
    if (categories[cat]) {
      categories[cat].push(bundle);
    } else {
      categories.other.push(bundle);
    }
  });
  
  return categories;
}

// Sort bundles by popularity and price
export function sortBundles(bundles: DataBundle[]): DataBundle[] {
  return [...bundles].sort((a, b) => {
    // Popular first
    if (a.isPopular && !b.isPopular) return -1;
    if (!a.isPopular && b.isPopular) return 1;
    // Then by price (low to high)
    return a.price - b.price;
  });
}
