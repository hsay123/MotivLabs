"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import type { ReactNode } from "react";
import { monadTestnet, privyAppId } from "@/lib/privy/config";

/**
 * Client-side providers for the whole app.
 *
 * Privy is the real authentication boundary: email (OTP) and wallet login, an
 * embedded wallet created for users who do not have one, and Monad testnet as
 * the default chain. The `usePrivy` / `getAccessToken` hooks used by the API
 * layer only exist beneath this provider.
 */
export function Providers({ children }: { children: ReactNode }) {
  if (!privyAppId) {
    throw new Error(
      "NEXT_PUBLIC_PRIVY_APP_ID is not set — authentication cannot start.",
    );
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: ["email", "wallet"],
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
        },
        defaultChain: monadTestnet,
        supportedChains: [monadTestnet],
        appearance: { theme: "light" },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
