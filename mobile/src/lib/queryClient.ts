import { QueryClient } from "@tanstack/react-query";

// Single React Query client for all Supabase server-state (progress sync,
// profile, leaderboard later). Client/UI state lives in Zustand instead.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false
    }
  }
});
