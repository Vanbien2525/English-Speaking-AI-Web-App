"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";

interface AppProvidersProps {
  readonly children: ReactNode;
}

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        // Scoring mutations are idempotent via idempotencyKey, but we never auto-retry
        // audio uploads silently — the UI decides.
        retry: 0,
      },
    },
  });
}

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster theme="dark" position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}
