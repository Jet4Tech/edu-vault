"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DownloadButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);

    try {
      const res = await fetch(`/api/download/${orderId}`);
      const data = await res.json();

      if (!res.ok) {
        alert(data.error ?? "Failed to start download.");
        return;
      }

      window.open(data.url, "_blank");
    } catch {
      alert("Failed to start download.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" onClick={handleClick} disabled={loading} className="w-full">
      <Download className="h-4 w-4" />
      {loading ? "Preparing..." : "Download"}
    </Button>
  );
}
