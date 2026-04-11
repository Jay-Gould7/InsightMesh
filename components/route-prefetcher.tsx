"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type RoutePrefetcherProps = {
  routes: Array<string | Route>;
  delayMs?: number;
};

export function RoutePrefetcher({
  routes,
  delayMs = 120,
}: RoutePrefetcherProps) {
  const router = useRouter();

  useEffect(() => {
    const uniqueRoutes = Array.from(
      new Set(routes.filter((route): route is string | Route => Boolean(route))),
    );

    if (uniqueRoutes.length === 0) {
      return;
    }

    const prefetchAll = () => {
      uniqueRoutes.forEach((route) => {
        router.prefetch(route as Route);
      });
    };

    const timer = window.setTimeout(prefetchAll, delayMs);

    const handleFocus = () => {
      prefetchAll();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        prefetchAll();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [delayMs, router, routes]);

  return null;
}
