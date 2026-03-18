"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function verifyAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  return user.email === process.env.ADMIN_EMAIL;
}

export async function activateUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { success: false, error: "Unauthorised" };

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("profiles")
    .update({ subscription_status: "active" })
    .eq("id", userId);

  if (error) return { success: false, error: "Failed to activate user" };
  return { success: true };
}

export async function revokeUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { success: false, error: "Unauthorised" };

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("profiles")
    .update({ subscription_status: null })
    .eq("id", userId);

  if (error) return { success: false, error: "Failed to revoke user" };
  return { success: true };
}
