import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AppLayout } from "@/components/layout/AppLayout";

// Space Grotesk — geometric display sans, the BlindPay-style voice.
const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-inter", // keep the CSS var name so existing classes pick it up
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

// Set NEXT_PUBLIC_SITE_URL to your deployed URL so link previews resolve the
// OG image absolutely. Falls back to Vercel's URL, then localhost in dev.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const TITLE = "Confidential Wrapper Registry";
const DESCRIPTION =
  "Every official ERC-20 ↔ ERC-7984 wrapper pair from Zama's onchain registry, on Sepolia and Ethereum mainnet. Wrap, unwrap, reveal your confidential balances, and faucet test tokens — in one app.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: TITLE,
    type: "website",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${grotesk.variable} ${jetbrainsMono.variable}`}>
      <body>
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  );
}
