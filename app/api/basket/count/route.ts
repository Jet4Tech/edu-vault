import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ count: 0 });
  }

  const { count } = await supabase
    .from("basket_items")
    .select("id", { count: "exact" })
    .eq("user_id", user.id);

  return NextResponse.json({ count: count || 0 });
}
