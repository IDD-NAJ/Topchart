"use client";

import useSWR from "swr";
import { getDashboardData, type DashboardData } from "@/lib/actions/dashboard";

/**
 * SWR hook for dashboard data with 30-second auto-refresh.
 * Revalidates on window focus and uses deduping to prevent
 * concurrent requests on rapid focus changes.
 */
export function useDashboardData() {
  return useSWR<DashboardData>("dashboard-overview", () => getDashboardData(), {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
    dedupingInterval: 8_000,
    keepPreviousData: true,
  });
}
