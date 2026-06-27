"use client";

import { useCallback, useEffect, useState } from "react";

export function useBasketCount() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/basket/count");
    const data = await res.json();
    setCount(data.count ?? 0);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    window.addEventListener("basket-updated", refresh);
    return () => window.removeEventListener("basket-updated", refresh);
  }, [refresh]);

  return { count, refresh };
}
