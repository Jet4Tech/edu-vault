import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { NavbarUserMenu } from "@/components/NavbarUserMenu";
import { BasketIcon } from "@/components/BasketIcon";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function Navbar() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="font-heading text-xl font-bold tracking-tight">
              Edu-Vault
            </span>
          </Link>
          <nav className="hidden items-center gap-5 sm:flex">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Browse
            </Link>
            {user && (
              <>
                <Link
                  href="/library"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Library
                </Link>
                <Link
                  href="/seller/dashboard"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Sell
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          <BasketIcon />
          {user ? (
            <NavbarUserMenu email={user.email!} />
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
      </div>
    </header>
  );
}
