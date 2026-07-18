import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-secondary/30">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-10 text-center">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-4 w-4" />
          </span>
          <span className="font-heading text-lg font-bold tracking-tight">
            Edu-Vault
          </span>
        </Link>
        <p className="max-w-md text-sm text-muted-foreground">
          Educational resources made by real teachers. Pay once, download
          forever — 90% of every sale goes to the creator.
        </p>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link href="/privacy-policy" className="transition-colors hover:text-foreground">
            Privacy Policy
          </Link>
          <Link href="/terms-of-service" className="transition-colors hover:text-foreground">
            Terms of Service
          </Link>
          <a href="mailto:hello@edu-vault.com" className="transition-colors hover:text-foreground">
            Contact
          </a>
        </div>
        <p className="text-xs text-muted-foreground">© {year} Edu-Vault</p>
      </div>
    </footer>
  );
}
