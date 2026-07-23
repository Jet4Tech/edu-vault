"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "../auth-shell";
import { PasswordField } from "../password-field";

export default function SignUpPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<{ message: string; showSignIn?: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError({ message: "Passwords do not match" });
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    setLoading(false);

    if (signUpError) {
      if (
        signUpError.message.includes("already") ||
        signUpError.message.includes("registered")
      ) {
        setError({
          message: "An account with this email already exists.",
          showSignIn: true,
        });
      } else if (signUpError.message.includes("Password")) {
        setError({ message: "Password must be at least 8 characters" });
      } else {
        setError({ message: "Sign-up failed. Please try again." });
      }
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <AuthShell
      title="Create your account"
      description="Join Edu-Vault to buy resources — or start selling your own."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="full-name">Full name</Label>
          <Input
            id="full-name"
            type="text"
            required
            autoComplete="name"
            placeholder="Alex Taylor"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10"
          />
        </div>

        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          minLength={8}
          hint="At least 8 characters."
        />

        <PasswordField
          label="Confirm password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
        />

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-destructive px-3 py-2 text-sm text-destructive"
          >
            {error.message}
            {error.showSignIn && (
              <>
                {" "}
                <Link href="/sign-in" className="underline underline-offset-4">
                  Sign in
                </Link>
              </>
            )}
          </p>
        )}

        <Button type="submit" className="h-10 w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Creating account..." : "Create account"}
        </Button>

        <p className="text-xs text-muted-foreground">
          By creating an account you agree to our{" "}
          <Link href="/terms-of-service" className="underline underline-offset-4">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy-policy" className="underline underline-offset-4">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </AuthShell>
  );
}
