import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";

export default async function HomePage() {
  const session = await requireSession();
  redirect(session ? "/dashboard" : "/login");
}
