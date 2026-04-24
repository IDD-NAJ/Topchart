"use client";

import useSWR from "swr";

interface ServiceStatus {
  service_key: string;
  service_name: string;
  is_coming_soon: boolean;
  coming_soon_message: string | null;
  expected_launch_date: string | null;
  is_enabled: boolean;
}

interface ServiceStatusResponse {
  success: boolean;
  services: ServiceStatus[];
  cached_at?: string;
}

const fetcher = async (url: string): Promise<ServiceStatusResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    return { success: false, services: [] };
  }
  return res.json();
};

/**
 * Hook to check service status across the application
 * Provides utilities to check if a service is coming soon
 */
export function useServiceStatus() {
  const { data, error, isLoading, mutate } = useSWR<ServiceStatusResponse>(
    "/api/service-status",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
      refreshInterval: 300000, // 5 minutes
    }
  );

  const services = data?.services || [];

  /**
   * Check if a specific service is marked as "Coming Soon"
   */
  const isComingSoon = (serviceKey: string): boolean => {
    const service = services.find((s) => s.service_key === serviceKey);
    return service?.is_coming_soon ?? false;
  };

  /**
   * Get the coming soon message for a service
   */
  const getComingSoonMessage = (serviceKey: string): string | null => {
    const service = services.find((s) => s.service_key === serviceKey);
    if (!service?.is_coming_soon) return null;
    return service.coming_soon_message || "This service is coming soon!";
  };

  /**
   * Get the expected launch date for a service
   */
  const getExpectedLaunchDate = (serviceKey: string): string | null => {
    const service = services.find((s) => s.service_key === serviceKey);
    return service?.expected_launch_date || null;
  };

  /**
   * Check if a service is enabled
   */
  const isEnabled = (serviceKey: string): boolean => {
    const service = services.find((s) => s.service_key === serviceKey);
    return service?.is_enabled ?? true;
  };

  /**
   * Get full service details
   */
  const getService = (serviceKey: string): ServiceStatus | undefined => {
    return services.find((s) => s.service_key === serviceKey);
  };

  /**
   * Get all services that are coming soon
   */
  const getComingSoonServices = (): ServiceStatus[] => {
    return services.filter((s) => s.is_coming_soon);
  };

  return {
    services,
    isLoading,
    error,
    isComingSoon,
    getComingSoonMessage,
    getExpectedLaunchDate,
    isEnabled,
    getService,
    getComingSoonServices,
    refresh: mutate,
  };
}

/**
 * Service keys used throughout the application
 */
export const SERVICE_KEYS = {
  AIRTIME: "airtime",
  DATA: "data",
  ESIM: "esim",
  VERIFICATION: "verification",
  PROXY: "proxy",
  GIFTCARDS: "giftcards",
  BILLS: "bills",
  RESULT_CHECKER: "result_checker",
} as const;

export type ServiceKey = (typeof SERVICE_KEYS)[keyof typeof SERVICE_KEYS];
