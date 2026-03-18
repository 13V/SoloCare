"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { activateUser, revokeUser } from "./actions";

interface UserActionsProps {
  userId: string;
  currentStatus: string | null;
}

export function UserActions({ userId, currentStatus }: UserActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleActivate() {
    startTransition(async () => {
      const result = await activateUser(userId);
      if (result.success) {
        toast.success("User activated successfully");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to activate user");
      }
    });
  }

  function handleRevoke() {
    startTransition(async () => {
      const result = await revokeUser(userId);
      if (result.success) {
        toast.success("User subscription revoked");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to revoke user");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      {currentStatus !== "active" && (
        <Button
          size="sm"
          variant="success"
          onClick={handleActivate}
          disabled={isPending}
        >
          Activate
        </Button>
      )}
      {currentStatus === "active" && (
        <Button
          size="sm"
          variant="destructive"
          onClick={handleRevoke}
          disabled={isPending}
        >
          Revoke
        </Button>
      )}
    </div>
  );
}
