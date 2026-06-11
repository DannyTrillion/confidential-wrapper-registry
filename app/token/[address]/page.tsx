import { Suspense } from "react";
import { TokenDetail } from "@/components/views/TokenDetail";

export default function Page({ params }: { params: { address: string } }) {
  // Suspense boundary lets TokenDetail read ?action= via useSearchParams safely.
  return (
    <Suspense>
      <TokenDetail address={params.address} />
    </Suspense>
  );
}
