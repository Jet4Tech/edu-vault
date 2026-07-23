import Link from "next/link";
import { BadgeCheck, GraduationCap, Infinity as InfinityIcon, ShieldCheck } from "lucide-react";

const HIGHLIGHTS = [
  {
    icon: BadgeCheck,
    title: "90% goes to creators",
    body: "Teachers and students keep the vast majority of every sale.",
  },
  {
    icon: InfinityIcon,
    title: "Pay once, keep forever",
    body: "Download your resources any time — no subscriptions.",
  },
  {
    icon: ShieldCheck,
    title: "Secure checkout",
    body: "Payments and payouts are handled by Stripe.",
  },
];

/**
 * Shared frame for sign-in and sign-up: a brand panel on large screens and the
 * form beside it. Both pages were previously a bare card on an empty page, so
 * the marketing promise and the product name never reached the one screen every
 * new user has to pass through.
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    // Root layout already renders the navbar above this, so min-h-screen would
    // push the panel a navbar's height below the fold.
    <div className="grid min-h-[calc(100vh-3.5rem)] lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        {/* Decorative wash. Opacity lives on the element rather than in a
            bg-accent/25 style modifier: the palette maps to complete oklch()
            values, so Tailwind's slash modifiers can't resolve an alpha and
            silently render transparent. These divs have no children, so fading
            the whole element is equivalent. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-28 h-96 w-96 rounded-full bg-accent opacity-25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-primary-foreground opacity-10 blur-3xl"
        />

        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground text-primary">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="font-heading text-xl font-bold tracking-tight">
            Edu-Vault
          </span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="font-heading text-4xl font-bold leading-tight tracking-tight">
            Learn smarter.
            <br />
            Teach better.
          </h2>
          <p className="mt-4 text-base opacity-75">
            Revision notes, worksheets and lesson plans from real teachers and
            students — for teachers and students.
          </p>

          <ul className="mt-10 space-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, title: heading, body }) => (
              <li key={heading} className="flex gap-3.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-foreground text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{heading}</span>
                  <span className="block text-sm opacity-75">{body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs opacity-60">
          Share knowledge. Make quality education accessible for everyone.
        </p>
      </aside>

      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* The brand panel is hidden below lg, so mobile needs its own mark. */}
          <Link
            href="/"
            className="mb-10 flex items-center gap-2.5 lg:hidden"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="font-heading text-xl font-bold tracking-tight">
              Edu-Vault
            </span>
          </Link>

          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {title}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>

          <div className="mt-8">{children}</div>

          <div className="mt-8 border-t pt-6 text-sm text-muted-foreground">
            {footer}
          </div>
        </div>
      </main>
    </div>
  );
}
