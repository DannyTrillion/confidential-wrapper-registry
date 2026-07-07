import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "./providers";
import { AppLayout } from "@/components/layout/AppLayout";
import { THEME_SCRIPT } from "@/components/ThemeToggle";

// Geist (Vercel's neutral grotesk) for UI + Geist Mono for all numbers/hashes.
// Self-hosted via the `geist` package — no Google-Fonts fetch at build time.

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
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Apply saved/system theme before paint to avoid a flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  );
}
