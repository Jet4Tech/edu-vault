import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t py-6 text-center text-sm text-muted-foreground">
      <p>© {year} Edu-Vault</p>
      <div className="mt-2 flex justify-center gap-4">
        <Link href="/privacy-policy" className="hover:text-foreground">
          Privacy Policy
        </Link>
        <Link href="/terms-of-service" className="hover:text-foreground">
          Terms of Service
        </Link>
        <a href="mailto:hello@edu-vault.com" className="hover:text-foreground">
          Contact
        </a>
      </div>
    </footer>
  );
}
