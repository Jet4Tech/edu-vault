"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Full page load so the server-rendered navbar picks up the signed-out state.
    window.location.href = "/";
  }

  return (
    <Button variant="outline" onClick={handleLogout}>
      Log out
    </Button>
  );
}
