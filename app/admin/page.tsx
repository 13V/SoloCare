import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UserTable } from "./UserTable";

export const metadata = { title: "Admin — SoloCare" };

export default async function AdminPage() {
  // Auth check — return 404 if not the admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    notFound();
  }

  // Fetch all auth users via service role
  const adminClient = createAdminClient();
  const {
    data: { users: authUsers },
  } = await adminClient.auth.admin.listUsers({ perPage: 1000 });

  // Fetch all profiles
  const { data: profiles } = await adminClient
    .from("profiles")
    .select(
      "id, subscription_status, onboarding_complete, business_name, contact_name, created_at"
    )
    .limit(1000);

  const profileMap = new Map(
    (profiles ?? []).map((p: {
      id: string;
      subscription_status: string | null;
      onboarding_complete: boolean;
      business_name: string | null;
      contact_name: string | null;
      created_at: string;
    }) => [p.id, p])
  );

  const rows = authUsers.map((authUser) => {
    const profile = profileMap.get(authUser.id);
    return {
      id: authUser.id,
      email: authUser.email ?? "",
      name:
        profile?.contact_name || profile?.business_name || "",
      subscription_status: profile?.subscription_status ?? null,
      onboarding_complete: profile?.onboarding_complete ?? false,
      created_at: authUser.created_at,
    };
  });

  // Sort by created_at descending
  rows.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A] font-heading">
          Admin — User Management
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          {rows.length} registered user{rows.length !== 1 ? "s" : ""}
        </p>
      </div>

      <UserTable users={rows} />
    </div>
  );
}
