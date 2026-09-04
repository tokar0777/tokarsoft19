import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useDeleteRow, useRiskRules, useSetups, useUpsertRow } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/risk")({
  head: () => ({
    meta: [
      { title: "Risk & Setups — TOKARsoft19" },
      {
        name: "description",
        content:
          "Store your money-management rules and build a library of SMC setups with required confluence checklists.",
      },
      { property: "og:title", content: "Risk & Setups — TOKARsoft19" },
      {
        property: "og:description",
        content: "Money-management rules and a reusable Smart Money Concepts setup library.",
      },
    ],
  }),
  component: RiskPage,
});

function RiskPage() {
  const { session } = useAuth();
  const { t } = useI18n();
  const enabled = !!session;
  const { data: rules = [] } = useRiskRules(enabled);
  const { data: setups = [] } = useSetups(enabled);
  const upsertRule = useUpsertRow("risk_rules", "risk_rules");
  const deleteRule = useDeleteRow("risk_rules", "risk_rules");
  const upsertSetup = useUpsertRow("setups", "setups");
  const deleteSetup = useDeleteRow("setups", "setups");

  const [newRule, setNewRule] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [confluences, setConfluences] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  async function addRule(e: React.FormEvent) {
    e.preventDefault();
    if (!newRule.trim()) return;
    await upsertRule.mutateAsync({ rule: newRule.trim(), is_active: true });
    setNewRule("");
    toast.success(t("risk.ruleAdded"));
  }

  async function saveSetup(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await upsertSetup.mutateAsync({
      ...(editingId ? { id: editingId } : {}),
      name: name.trim(),
      description: description.trim(),
      confluences: confluences
        .split("\n")
        .map((c) => c.trim())
        .filter(Boolean),
    });
    toast.success(editingId ? t("risk.setupUpdated") : t("risk.setupCreated"));
    setEditingId(null);
    setName("");
    setDescription("");
    setConfluences("");
  }

  return (
    <AppShell title={t("risk.title")} subtitle={t("risk.subtitle")}>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold tracking-wide">{t("risk.rules")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("risk.rulesHint")}
          </p>

          <ul className="mt-4 space-y-2">
            {rules.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2.5"
              >
                <Checkbox
                  checked={r.is_active}
                  onCheckedChange={(v) =>
                    upsertRule.mutate({ id: r.id, is_active: v === true })
                  }
                />
                <span
                  className={cn(
                    "flex-1 text-sm",
                    !r.is_active && "text-muted-foreground line-through",
                  )}
                >
                  {r.rule}
                </span>
                <button
                  onClick={() => deleteRule.mutate(r.id)}
                  className="text-muted-foreground transition-colors hover:text-short"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
            {rules.length === 0 && (
              <li className="py-6 text-center text-sm text-muted-foreground">{t("risk.noRules")}</li>
            )}
          </ul>

          <form onSubmit={addRule} className="mt-4 flex gap-2">
            <Input
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              placeholder={t("risk.rulePlaceholder")}
            />
            <Button type="submit" size="icon">
              <Plus className="size-4" />
            </Button>
          </form>
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold tracking-wide">
            {editingId ? t("risk.editSetup") : t("risk.newSetup")}
          </h2>
          <form onSubmit={saveSetup} className="mt-4 space-y-3">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t("risk.setupName")}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("risk.setupNamePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t("risk.description")}</Label>
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("risk.descriptionPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {t("risk.confluences")}
              </Label>
              <Textarea
                rows={4}
                value={confluences}
                onChange={(e) => setConfluences(e.target.value)}
                placeholder={"Asian range swept\nDisplacement with FVG\nHTF discount"}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={upsertSetup.isPending}>
                {editingId ? t("risk.update") : t("risk.create")}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setName("");
                    setDescription("");
                    setConfluences("");
                  }}
                >
                  <X className="size-4" /> {t("risk.cancel")}
                </Button>
              )}
            </div>
          </form>
        </section>
      </div>

      <section className="mt-4">
        <h2 className="mb-3 text-sm font-semibold tracking-wide">{t("risk.library")}</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {setups.map((s) => (
            <article key={s.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold">{s.name}</h3>
                <div className="flex gap-1">
                  <button
                    className="text-xs text-primary hover:underline"
                    onClick={() => {
                      setEditingId(s.id);
                      setName(s.name);
                      setDescription(s.description);
                      setConfluences(s.confluences.join("\n"));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    {t("risk.editAction")}
                  </button>
                  <button
                    className="text-muted-foreground transition-colors hover:text-short"
                    onClick={() => deleteSetup.mutate(s.id)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{s.description}</p>
              <ul className="mt-3 space-y-1.5">
                {s.confluences.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-xs">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-long" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
          {setups.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("risk.noSetups")}</p>
          )}
        </div>
      </section>
    </AppShell>
  );
}
