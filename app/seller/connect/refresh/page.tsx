"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ConnectRefreshPage() {
  const [loading, setLoading] = useState(false);

  async function handleTryAgain() {
    setLoading(true);

    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error ?? "Something went wrong");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">Onboarding incomplete</h1>
      <p className="mt-2 text-muted-foreground">
        It looks like you didn&apos;t finish connecting your Stripe account.
      </p>

      <div className="mt-6">
        <Button onClick={handleTryAgain} disabled={loading}>
          {loading ? "Redirecting..." : "Try again"}
        </Button>
      </div>

      <div className="mt-8">
        <Link href="/seller/dashboard" className="underline">
          ← Go back to dashboard
        </Link>
      </div>
    </div>
  );
}
