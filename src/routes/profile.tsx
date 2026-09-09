import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, KeyRound, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Account — TOKARsoft19" },
      {
        name: "description",
        content: "Manage your TOKARsoft19 account: user ID, email address and password.",
      },
      { property: "og:title", content: "Account — TOKARsoft19" },
      {
        property: "og:description",
        content: "Manage your TOKARsoft19 account: user ID, email address and password.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, session } = useAuth();
  const { t } = useI18n();
  const { data: access } = useProfile(!!session);
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser(
        { email: newEmail },
        { emailRedirectTo: window.location.origin + "/auth" },
      );
      if (error) throw error;
      toast.success(t("profile.emailSent"));
      setNewEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(t("profile.mismatch"));
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        current_password: currentPassword,
      } as never);
      if (error) throw error;
      toast.success(t("profile.passwordUpdated"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const status = access?.profile?.status ?? "pending";

  return (
    <AppShell title={t("profile.title")} subtitle={t("profile.subtitle")}>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-surface p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <UserRound className="size-4 text-primary" /> {t("profile.account")}
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">{t("profile.email")}</dt>
              <dd className="tabular break-all">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("profile.userId")}</dt>
              <dd className="flex items-center gap-2">
                <code className="tabular break-all text-xs">{user?.id}</code>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-primary"
                  onClick={() => {
                    navigator.clipboard.writeText(user?.id ?? "");
                    toast.success(t("profile.copied"));
                  }}
                >
                  <Copy className="size-3.5" />
                </button>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("profile.status")}</dt>
              <dd className="uppercase tracking-wide text-primary">{status}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("profile.role")}</dt>
              <dd className="uppercase tracking-wide">{access?.isAdmin ? "admin" : "user"}</dd>
            </div>
          </dl>
        </section>

        <div className="space-y-6">
          <form onSubmit={changeEmail} className="rounded-lg border border-border bg-surface p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Mail className="size-4 text-primary" /> {t("profile.changeEmail")}
            </h2>
            <div className="mt-4 space-y-2">
              <Label htmlFor="newEmail">{t("profile.newEmail")}</Label>
              <Input
                id="newEmail"
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new@desk.com"
              />
            </div>
            <Button type="submit" className="mt-4 w-full" disabled={busy}>
              {t("profile.updateEmail")}
            </Button>
          </form>

          <form onSubmit={changePassword} className="rounded-lg border border-border bg-surface p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <KeyRound className="size-4 text-primary" /> {t("profile.changePassword")}
            </h2>
            <div className="mt-4 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="cpw">{t("profile.currentPassword")}</Label>
                <Input
                  id="cpw"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="npw">{t("profile.newPassword")}</Label>
                <Input
                  id="npw"
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="npw2">{t("profile.confirmPassword")}</Label>
                <Input
                  id="npw2"
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" className="mt-4 w-full" disabled={busy}>
              {t("profile.updatePassword")}
            </Button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
