"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CheckoutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleClick() {
    setLoading(true);
    setError(false);

    try {
      const res = await fetch("/api/checkout", { method: "POST" });

      if (!res.ok) {
        setError(true);
        setLoading(false);
        return;
      }

      const data = await res.json();
      window.location.href = data.url;
    } catch {
      setError(true);
      setLoading(false);
    }
  }

  return (
    <div>
      <Button onClick={handleClick} disabled={loading} className="w-full">
        {loading ? "Redirecting..." : "Checkout"}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-destructive">
          Something went wrong starting checkout. Please try again.
        </p>
      )}
    </div>
  );
}
