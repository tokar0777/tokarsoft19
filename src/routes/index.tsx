import { Link, createFileRoute } from "@tanstack/react-router";
import { Activity, ArrowRight, BarChart3, BookOpen, Bot, Send, Shield, Youtube } from "lucide-react";
import { LANGS, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TOKARsoft19 — SMC / ICT Trading Journal & Analytics Terminal" },
      {
        name: "description",
        content:
          "TOKARsoft19 is a professional Smart Money Concepts trading journal: trade logging, setup analytics, risk rules and an AI SMC chart validator.",
      },
      { property: "og:title", content: "TOKARsoft19 — SMC / ICT Trading Terminal" },
      {
        property: "og:description",
        content:
          "Structured trade journal, setup analytics, risk rules and AI SMC validation for ICT traders.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { t, lang, setLang } = useI18n();

  const features = [
    { icon: BookOpen, title: t("landing.f1t"), desc: t("landing.f1d") },
    { icon: BarChart3, title: t("landing.f2t"), desc: t("landing.f2d") },
    { icon: Shield, title: t("landing.f3t"), desc: t("landing.f3d") },
    { icon: Bot, title: t("landing.f4t"), desc: t("landing.f4d") },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4 md:px-8">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary/15 text-primary">
              <Activity className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-[0.14em]">TOKARsoft19</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
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
            <Link
              to="/auth"
              className="hidden rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
            >
              {t("landing.ctaSignIn")}
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-16 text-center md:px-8 md:pt-24">
          <span className="tabular inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] tracking-[0.22em] text-primary">
            {t("landing.badge")}
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            {t("landing.title")}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            {t("landing.sub")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {t("landing.cta")} <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-md border border-border px-6 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("landing.ctaSignIn")}
            </Link>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-20 md:grid-cols-2 md:px-8 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-lg border border-border bg-surface p-5 transition-colors hover:border-primary/40"
            >
              <span className="flex size-10 items-center justify-center rounded-md bg-primary/15 text-primary">
                <f.icon className="size-5" />
              </span>
              <h2 className="mt-4 text-sm font-semibold tracking-tight">{f.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 md:px-8">
          <p className="text-xs text-muted-foreground">© 2026 TOKARsoft19</p>
          <div className="flex items-center gap-2">
            <a
              href="https://t.me/tokartrading"
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
            >
              <Send className="size-3.5" /> {t("shell.telegram")}
            </a>
            <a
              href="https://t.me/vadyaa_77"
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
            >
              <Send className="size-3.5" /> {t("shell.support")}
            </a>
            <a
              href="https://youtube.com/@tokarsss?si=Y3kig7daZaRmPxTi"
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
            >
              <Youtube className="size-3.5" /> {t("shell.youtube")}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
