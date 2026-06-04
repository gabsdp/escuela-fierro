import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default function Home() {
  redirect("/escuela");
}
