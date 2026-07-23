"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function StartSellingButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);

    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.url) {
        alert(data?.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      alert("Couldn't reach Stripe. Please check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading}>
      {loading ? "Redirecting..." : "Start selling on Edu-Vault"}
    </Button>
  );
}
