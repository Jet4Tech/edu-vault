"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function StartSellingButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
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
    <Button onClick={handleClick} disabled={loading}>
      {loading ? "Redirecting..." : "Start selling on Edu-Vault"}
    </Button>
  );
}
