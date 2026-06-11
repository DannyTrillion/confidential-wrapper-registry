"use client";

import { type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ExplorerNetworkProvider, useExplorerNetwork } from "@/components/NetworkContext";
import { useRegistryPairs } from "@/lib/registry/useRegistry";
import { AmbientBackground } from "@/components/fx/AmbientBackground";
import { CommandPalette } from "@/components/CommandPalette";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileNav } from "./MobileNav";
import { Footer } from "./Footer";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ExplorerNetworkProvider>
      <Shell>{children}</Shell>
    </ExplorerNetworkProvider>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const { chainId, setChainId } = useExplorerNetwork();
  const { data: pairs } = useRegistryPairs(chainId);
  const router = useRouter();

  return (
    <>
      <AmbientBackground />
      <Sidebar />

      <div className="lg:pl-60 min-h-screen flex flex-col">
        <TopBar />
        <main className="flex-1 w-full max-w-[1240px] mx-auto px-4 sm:px-6 py-7 sm:py-9 pb-24 lg:pb-9">
          {children}
        </main>
        <Footer />
      </div>

      <MobileNav />

      <CommandPalette
        pairs={pairs ?? []}
        chainId={chainId}
        setChainId={setChainId}
        onOpenPair={(p) => router.push(`/token/${p.confidentialToken}`)}
      />
      <OnboardingTour />
    </>
  );
}
