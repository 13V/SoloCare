"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function SubscribedToast() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("subscribed") === "true") {
      toast.success("Welcome to SoloCare! You're all set.", {
        description: "Start by generating your NDIS policies — it takes about 60 seconds.",
        duration: 6000,
      });
    }
  }, [searchParams]);

  return null;
}
