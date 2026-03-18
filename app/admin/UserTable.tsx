"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { UserActions } from "./UserActions";

interface UserRow {
  id: string;
  email: string;
  name: string;
  subscription_status: string | null;
  onboarding_complete: boolean;
  created_at: string;
}

interface UserTableProps {
  users: UserRow[];
}

export function UserTable({ users }: UserTableProps) {
  const [search, setSearch] = useState("");

  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Email
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Name
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Subscription
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Onboarding
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Joined
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                  >
                    <td className="px-4 py-3 text-slate-800 font-mono text-xs">
                      {user.email}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {user.name || (
                        <span className="text-slate-400 italic">Not set</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {user.subscription_status === "active" ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="warning">No subscription</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          user.onboarding_complete
                            ? "text-green-600 font-medium"
                            : "text-slate-400"
                        }
                      >
                        {user.onboarding_complete ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(user.created_at).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <UserActions
                        userId={user.id}
                        currentStatus={user.subscription_status}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        {filtered.length} of {users.length} user{users.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
