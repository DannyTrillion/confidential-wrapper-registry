"use client";

import { type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ExplorerNetworkProvider, useExplorerNetwork } from "@/components/NetworkContext";
import { useRegistryPairs } from "@/lib/registry/useRegistry";
import { AmbientBackground } from "@/components/fx/AmbientBackground";
import { CommandPalette } from "@/components/CommandPalette";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { Footer } from "./Footer";
import { SelectedPairProvider } from "@/components/SelectedPairContext";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ExplorerNetworkProvider>
      <SelectedPairProvider>
        <Shell>{children}</Shell>
      </SelectedPairProvider>
    </ExplorerNetworkProvider>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const { chainId, setChainId } = useExplorerNetwork();
  const { data: pairs } = useRegistryPairs(chainId);
  const router = useRouter();
  const pathname = usePathname();

  return (
    <>
      <AmbientBackground />
      <Sidebar />

      <div className="lg:pl-56 min-h-screen flex flex-col">
        <TopBar />
        <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 pt-4 sm:pt-5 pb-24 lg:pb-9">
          {children}
        </main>
        {pathname === "/" && <Footer />}
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
