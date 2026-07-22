"use client";

import useSWR from "swr";
import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

const LOW_BALANCE_THRESHOLD = 5; // GHS
const fetcher = (url: string) =>
  fetch(url, { credentials: "include" })
    .then((r) => r.json())
    .then((r) => {
      if (!r.success) throw new Error(r.error || "Failed to fetch balance");
      return r.data as { balance: number; pendingBalance: number };
    });

/**
 * Polls /api/wallet every 30 s and provides the live balance.
 * Fires a low-balance warning toast once per session when balance < LOW_BALANCE_THRESHOLD.
 * Fires a credit toast when balance increases between polls (e.g. a new deposit arrives).
 */
export function useLiveBalance() {
  const { toast } = useToast();
  const prevBalance = useRef<number | null>(null);
  const lowBalanceToastFired = useRef(false);

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    "/api/wallet",
    fetcher,
    {
      refreshInterval: 30_000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 8_000,
    }
  );

  const balance = data?.balance ?? null;

  useEffect(() => {
    if (balance === null) return;

    // Detect new deposit arriving between polls
    if (prevBalance.current !== null && balance > prevBalance.current) {
      const added = (balance - prevBalance.current).toFixed(2);
      toast({
        title: "Wallet credited",
        description: `GH₵${added} has been added to your wallet.`,
      });
      lowBalanceToastFired.current = false; // reset low-balance guard after top-up
    }

    // Low-balance warning — fire once per session
    if (balance < LOW_BALANCE_THRESHOLD && !lowBalanceToastFired.current) {
      toast({
        title: "Low balance alert",
        description: `Your wallet balance is GH₵${balance.toFixed(2)}. Top up to continue purchasing services.`,
        variant: "destructive",
      });
      lowBalanceToastFired.current = true;
    }

    prevBalance.current = balance;
  }, [balance, toast]);

  return {
    balance,
    pendingBalance: data?.pendingBalance ?? 0,
    isLoading,
    isValidating,
    mutate,
    error,
  };
}
