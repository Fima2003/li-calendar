"use client";

import CalendarGrid from "@/components/CalendarGrid";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        {/* Optional: Loading spinner */}
      </div>
    );
  }

  return (
    <main>
      <CalendarGrid />
    </main>
  );
}
