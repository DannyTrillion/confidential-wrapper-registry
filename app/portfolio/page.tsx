import type { Metadata } from "next";
import { PortfolioView } from "@/components/views/PortfolioView";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Your confidential holdings in one dashboard — encrypted onchain, revealed client-side with a single signature.",
};

export default function Page() {
  return <PortfolioView />;
}
