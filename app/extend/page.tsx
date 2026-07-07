import { redirect } from "next/navigation";

/** The pair builder moved into the Developer Kit. */
export default function Page() {
  redirect("/developers#add-pair");
}
