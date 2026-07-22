import useSWR from "swr";
import { ForeignNumbersSummary } from "@/lib/actions/dashboard";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

export function useForeignNumbers() {
  const { data, error, isLoading, mutate } = useSWR<ForeignNumbersSummary>(
    "/api/dashboard/foreign-numbers",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
      focusThrottleInterval: 300000, // 5 minutes
    }
  );

  return {
    data,
    isLoading,
    isError: !!error,
    mutate,
  };
}
