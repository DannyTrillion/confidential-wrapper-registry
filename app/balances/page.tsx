import { redirect } from "next/navigation";

/** The balances page moved — portfolio is its jup.ag-style successor. */
export default function Page() {
  redirect("/portfolio");
}
