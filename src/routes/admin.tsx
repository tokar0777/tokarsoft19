import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useAllProfiles, useProfile, useSetUserStatus, type AccountStatus } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — TOKARsoft19" },
      {
        name: "description",
        content: "Review registered traders and approve or reject access to the TOKARsoft19 terminal.",
      },
      { property: "og:title", content: "Admin Panel — TOKARsoft19" },
      { property: "og:description", content: "Approve or reject access requests for the TOKARsoft19 terminal." },
    ],
  }),
  component: AdminPage,
});

const STATUS_STYLES: Record<AccountStatus, string> = {
  approved: "border-long/40 bg-long/10 text-long",
  pending: "border-border bg-surface text-muted-foreground",
  rejected: "border-short/40 bg-short/10 text-short",
};

function AdminPage() {
  const { session } = useAuth();
  const { data: access } = useProfile(!!session);
  const isAdmin = !!access?.isAdmin;
  const { data: users = [], isLoading } = useAllProfiles(isAdmin);
  const setStatus = useSetUserStatus();

  const update = (id: string, status: AccountStatus) =>
    setStatus.mutate(
      { id, status },
      {
        onSuccess: () => toast.success(status === "approved" ? "Access granted" : "Access rejected"),
        onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
      },
    );

  return (
    <AppShell requireAdmin title="Admin Panel" subtitle="Approve or reject terminal access requests">
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Registered</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Loading users…
                </td>
              </tr>
            )}
            {!isLoading && users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No registered users yet.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3">{u.email || "—"}</td>
                <td className="tabular px-4 py-3 text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded border px-2 py-0.5 text-[11px] uppercase tracking-[0.12em]",
                      STATUS_STYLES[u.status],
                    )}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={u.status === "approved" || setStatus.isPending}
                      onClick={() => update(u.id, "approved")}
                    >
                      <Check className="size-3.5" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={u.status === "rejected" || setStatus.isPending}
                      onClick={() => update(u.id, "rejected")}
                    >
                      <X className="size-3.5" /> Reject
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
