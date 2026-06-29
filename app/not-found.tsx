import Link from "next/link";
import { Mascot } from "@/components/onboarding/Mascot";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] grid place-items-center px-4">
      <div className="max-w-md text-center">
        <Mascot mood="think" size={84} className="mx-auto" />
        <h1 className="mt-5 text-xl font-semibold text-ink tracking-tight">Page not found</h1>
        <p className="mt-2 text-13 text-ink-muted leading-relaxed">
          That page doesn&apos;t exist. The token you&apos;re after might use a different address, or the link
          may be out of date.
        </p>
        <div className="mt-5 flex items-center justify-center gap-2.5">
          <Link
            href="/"
            className="h-9 px-4 inline-flex items-center rounded-pill text-13 font-semibold bg-accent text-[#0a0a0a] hover:brightness-105 active:scale-[0.97] transition"
          >
            Back to registry
          </Link>
          <Link
            href="/docs"
            className="h-9 px-4 inline-flex items-center rounded-pill text-13 font-medium text-ink-muted border border-line hover:border-line-strong hover:text-ink transition-colors"
          >
            Read the guide
          </Link>
        </div>
      </div>
    </div>
  );
}
