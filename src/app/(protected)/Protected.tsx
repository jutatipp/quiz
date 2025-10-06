"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Protected({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem("appUser");
    if (!raw) router.replace("/login");
  }, [router]);

  if (typeof window !== "undefined" && !localStorage.getItem("appUser")) return null;
  return <>{children}</>;
}
