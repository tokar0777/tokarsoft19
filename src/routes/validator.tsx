import { createFileRoute } from "@tanstack/react-router";
import { Bot, Construction } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/validator")({
  head: () => ({
    meta: [
      { title: "SMC Validator Bot — TOKARsoft19" },
      {
        name: "description",
        content:
          "AI SMC validation engine for ICT trade ideas — currently in development.",
      },
      { property: "og:title", content: "SMC Validator Bot — TOKARsoft19" },
      {
        property: "og:description",
        content: "Strict ICT validation of your trade idea: structure, liquidity, POI, verdict.",
      },
    ],
  }),
  component: ValidatorPage,
});

function ValidatorPage() {
  const { t } = useI18n();

  return (
    <AppShell title={t("nav.validator")} subtitle={t("val.soon.title")}>
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-10 text-center">
          <div className="relative mx-auto mb-6 flex size-16 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/10" />
            <span className="relative flex size-16 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
              <Bot className="size-7" />
            </span>
          </div>

          <span className="tabular inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[11px] tracking-[0.22em] text-primary">
            <Construction className="size-3.5" />
            {t("val.soon.badge")}
          </span>

          <h1 className="mt-5 text-2xl font-bold tracking-tight">{t("val.soon.title")}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {t("val.soon.body")}
          </p>
        </div>
      </div>
    </AppShell>
  );
}
