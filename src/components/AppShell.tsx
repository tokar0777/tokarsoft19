import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { BarChart3, BookOpen, Bot, Shield, LogOut, Menu, X, Activity, Send, Youtube, ShieldCheck, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { LANGS, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", labelKey: "nav.dashboard", icon: BarChart3 },
  { to: "/journal", labelKey: "nav.journal", icon: BookOpen },
  { to: "/validator", labelKey: "nav.validator", icon: Bot },
  { to: "/risk", labelKey: "nav.risk", icon: Shield },
] as const;

const SUPPORT_TELEGRAM = "https://t.me/vadyaa_77";

const SOCIALS = [
  { href: "https://t.me/tokartrading", labelKey: "shell.telegram", icon: Send },
  { href: SUPPORT_TELEGRAM, labelKey: "shell.support", icon: Send },
  { href: "https://youtube.com/@tokarsss?si=Y3kig7daZaRmPxTi", labelKey: "shell.youtube", icon: Youtube },
] as const;

function LanguageSelector() {
  const { lang, setLang, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t("shell.language")}
      className="flex items-center gap-0.5 rounded-md border border-border bg-surface p-0.5"
    >
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          aria-pressed={lang === code}
          onClick={() => setLang(code)}
          className={cn(
            "tabular rounded px-2 py-1 text-[11px] tracking-[0.12em] transition-colors",
            lang === code
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}

function PendingScreen({ status, onSignOut }: { status: "pending" | "rejected"; onSignOut: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-8 text-center">
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Clock className="size-5" />
        </span>
        <h1 className="text-lg font-semibold tracking-tight">
          {status === "rejected" ? t("pending.rejected") : t("pending.title")}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">{t("pending.body")}</p>
        <a
          href={SUPPORT_TELEGRAM}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Send className="size-4" /> {t("pending.cta")}
        </a>
        <button
          onClick={onSignOut}
          className="mt-3 w-full rounded-md border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("shell.signOut")}
        </button>
      </div>
    </div>
  );
}

export function AppShell({
  title,
  subtitle,
  children,
  requireAdmin = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  requireAdmin?: boolean;
}) {
  const { session, loading, user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: access, isLoading: accessLoading } = useProfile(!!session);
  const isAdmin = !!access?.isAdmin;
  const status = access?.profile?.status ?? "pending";

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  useEffect(() => {
    if (!loading && !session) {
      navigate({ to: "/auth" });
    }
  }, [loading, session, navigate]);

  if (loading || !session || (session && accessLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="tabular text-sm text-muted-foreground">{t("shell.loading")}</div>
      </div>
    );
  }

  if (!isAdmin && status !== "approved") {
    return <PendingScreen status={status === "rejected" ? "rejected" : "pending"} onSignOut={signOut} />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 text-center">
          <h1 className="text-lg font-semibold">{t("shell.accessDenied")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("shell.adminOnly")}</p>
          <Link to="/" className="mt-5 inline-block text-sm text-primary">
            {t("shell.backToDashboard")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {open && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-5">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Activity className="size-4" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-[0.14em] text-sidebar-foreground">TOKARsoft19</p>
            <p className="tabular text-[10px] tracking-[0.28em] text-muted-foreground">TOKARsoft19</p>
          </div>
          <button className="ml-auto text-muted-foreground lg:hidden" onClick={() => setOpen(false)}>
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {[...NAV, ...(isAdmin ? [{ to: "/admin", labelKey: "nav.admin", icon: ShieldCheck } as const] : [])].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              activeOptions={{ exact: item.to === "/" }}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{
                className:
                  "bg-sidebar-accent text-sidebar-primary font-medium border-l-2 border-sidebar-primary",
              }}
            >
              <item.icon className="size-4" />
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-2 pb-3">
            {SOCIALS.map((s) => (
              <a
                key={s.labelKey}
                href={s.href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={t(s.labelKey)}
                title={t(s.labelKey)}
                className="flex items-center gap-2 rounded-md border border-sidebar-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-primary"
              >
                <s.icon className="size-3.5" />
                {t(s.labelKey)}
              </a>
            ))}
          </div>
          <p className="truncate px-2 pb-2 text-xs text-muted-foreground">{user?.email}</p>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="size-4" /> {t("shell.signOut")}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-4 backdrop-blur md:px-8">
          <button className="text-muted-foreground lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="size-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight md:text-xl">{title}</h1>
            {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-1 sm:flex">
              {SOCIALS.map((s) => (
                <a
                  key={s.labelKey}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={t(s.labelKey)}
                  title={t(s.labelKey)}
                  className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-primary"
                >
                  <s.icon className="size-4" />
                </a>
              ))}
            </div>
            <LanguageSelector />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
