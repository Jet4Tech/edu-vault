"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function PublishToggleButton({
  productId,
  status,
}: {
  productId: string;
  status: "draft" | "published";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: status === "published" ? "draft" : "published",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Something went wrong");
        return;
      }

      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={loading}>
      {status === "published" ? "Unpublish" : "Publish"}
    </Button>
  );
}
