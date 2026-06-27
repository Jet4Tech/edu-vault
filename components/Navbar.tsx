import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { NavbarUserMenu } from "@/components/NavbarUserMenu";
import { BasketIcon } from "@/components/BasketIcon";

export default async function Navbar() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-lg font-bold">
          Edu-Vault
        </Link>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          Browse
        </Link>
        {user && (
          <>
            <Link href="/library" className="text-sm text-muted-foreground hover:text-foreground">
              Library
            </Link>
            <Link href="/seller/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              Sell
            </Link>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <BasketIcon />
            <NavbarUserMenu email={user.email!} />
          </>
        ) : (
          <>
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Sign up</Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
