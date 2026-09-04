import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useDeleteRow, useSetups, useTrades, useUpsertRow } from "@/lib/queries";
import { CATEGORIES, DIRECTIONS, OUTCOMES, formatR, type Trade } from "@/lib/trading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Trade Log — TOKARsoft19" },
      {
        name: "description",
        content:
          "Log and review every SMC execution: pair, direction, setup, entry, stop, target, realized R and confluence notes.",
      },
      { property: "og:title", content: "Trade Log — TOKARsoft19" },
      {
        property: "og:description",
        content: "Log and review every Smart Money Concepts execution with full confluence notes.",
      },
    ],
  }),
  component: JournalPage,
});

type FormState = {
  id?: string;
  traded_at: string;
  category: string;
  pair: string;
  direction: string;
  setup_id: string;
  entry_price: string;
  stop_loss: string;
  take_profit: string;
  realized_r: string;
  notes: string;
  chart_url: string;
  outcome: string;
};

function localInput(date: Date) {
  const off = date.getTimezoneOffset();
  return new Date(date.getTime() - off * 60000).toISOString().slice(0, 16);
}

const emptyForm = (): FormState => ({
  traded_at: localInput(new Date()),
  category: "Forex",
  pair: "",
  direction: "Long",
  setup_id: "",
  entry_price: "",
  stop_loss: "",
  take_profit: "",
  realized_r: "",
  notes: "",
  chart_url: "",
  outcome: "Win",
});

function JournalPage() {
  const { session } = useAuth();
  const { t: tr } = useI18n();
  const { data: trades = [], isLoading } = useTrades(!!session);
  const { data: setups = [] } = useSetups(!!session);
  const upsert = useUpsertRow("trades", "trades");
  const remove = useDeleteRow("trades", "trades");

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [outcomeFilter, setOutcomeFilter] = useState("All");

  const setupName = useMemo(
    () => new Map(setups.map((s) => [s.id, s.name])),
    [setups],
  );

  const visible = trades.filter((t) => outcomeFilter === "All" || t.outcome === outcomeFilter);

  function edit(trade: Trade) {
    setForm({
      id: trade.id,
      traded_at: localInput(new Date(trade.traded_at)),
      category: trade.category,
      pair: trade.pair,
      direction: trade.direction,
      setup_id: trade.setup_id ?? "",
      entry_price: trade.entry_price?.toString() ?? "",
      stop_loss: trade.stop_loss?.toString() ?? "",
      take_profit: trade.take_profit?.toString() ?? "",
      realized_r: String(trade.realized_r ?? 0),
      notes: trade.notes ?? "",
      chart_url: trade.chart_url ?? "",
      outcome: trade.outcome,
    });
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const num = (v: string) => (v.trim() === "" ? null : Number(v));
    try {
      await upsert.mutateAsync({
        ...(form.id ? { id: form.id } : {}),
        traded_at: new Date(form.traded_at).toISOString(),
        category: form.category,
        pair: form.pair.trim().toUpperCase(),
        direction: form.direction,
        setup_id: form.setup_id || null,
        entry_price: num(form.entry_price),
        stop_loss: num(form.stop_loss),
        take_profit: num(form.take_profit),
        realized_r: Number(form.realized_r || 0),
        notes: form.notes,
        chart_url: form.chart_url.trim() || null,
        outcome: form.outcome,
      });
      toast.success(form.id ? tr("journal.updated") : tr("journal.saved"));
      setOpen(false);
      setForm(emptyForm());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tr("journal.saveError"));
    }
  }

  return (
    <AppShell title={tr("journal.title")} subtitle={tr("journal.subtitle")}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-md bg-muted p-1">
          {["All", ...OUTCOMES].map((o) => (
            <button
              key={o}
              onClick={() => setOutcomeFilter(o)}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-medium transition-colors",
                outcomeFilter === o
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {o === "All" ? tr("f.All") : tr(`out.${o}`, o)}
            </button>
          ))}
        </div>
        <Button
          onClick={() => {
            setForm(emptyForm());
            setOpen(true);
          }}
        >
          <Plus className="size-4" /> {tr("journal.add")}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <th className="px-4 py-3 font-medium">{tr("journal.col.date")}</th>
              <th className="px-4 py-3 font-medium">{tr("journal.col.pair")}</th>
              <th className="px-4 py-3 font-medium">{tr("journal.col.class")}</th>
              <th className="px-4 py-3 font-medium">{tr("journal.col.side")}</th>
              <th className="px-4 py-3 font-medium">{tr("journal.col.setup")}</th>
              <th className="px-4 py-3 font-medium">{tr("journal.col.prices")}</th>
              <th className="px-4 py-3 font-medium">R</th>
              <th className="px-4 py-3 font-medium">{tr("journal.col.outcome")}</th>
              <th className="px-4 py-3 font-medium">{tr("journal.col.chart")}</th>
              <th className="px-4 py-3 text-right font-medium">{tr("journal.col.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((t) => (
              <tr key={t.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                <td className="tabular px-4 py-3 text-xs text-muted-foreground">
                  {new Date(t.traded_at).toLocaleString(undefined, {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="tabular px-4 py-3 font-medium">{t.pair}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{tr(`cat.${t.category}`, t.category)}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded px-2 py-0.5 text-[11px] font-semibold",
                      t.direction === "Long"
                        ? "bg-long/15 text-long"
                        : "bg-short/15 text-short",
                    )}
                  >
                    {tr(`dir.${t.direction}`, t.direction)}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">
                  {t.setup_id ? (
                    <span className="rounded border border-border px-2 py-0.5 text-muted-foreground">
                      {setupName.get(t.setup_id) ?? "Setup"}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="tabular px-4 py-3 text-xs text-muted-foreground">
                  {[t.entry_price, t.stop_loss, t.take_profit]
                    .map((v) => (v === null || v === undefined ? "—" : v))
                    .join(" / ")}
                </td>
                <td
                  className={cn(
                    "tabular px-4 py-3 font-semibold",
                    Number(t.realized_r) > 0 && "text-long",
                    Number(t.realized_r) < 0 && "text-short",
                  )}
                >
                  {formatR(Number(t.realized_r))}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded px-2 py-0.5 text-[11px] font-semibold",
                      t.outcome === "Win" && "bg-long/15 text-long",
                      t.outcome === "Loss" && "bg-short/15 text-short",
                      t.outcome === "Break-Even" && "bg-muted text-muted-foreground",
                    )}
                  >
                    {tr(`out.${t.outcome}`, t.outcome)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {t.chart_url ? (
                    <a
                      href={t.chart_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      {tr("journal.view")} <ExternalLink className="size-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => edit(t)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={async () => {
                        await remove.mutateAsync(t.id);
                        toast.success(tr("journal.deleted"));
                      }}
                    >
                      <Trash2 className="size-4 text-short" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  {isLoading ? tr("journal.loading") : tr("journal.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? tr("journal.edit") : tr("journal.add")}</DialogTitle>
            <DialogDescription>{tr("journal.modalDesc")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={tr("journal.field.datetime")}>
                <Input
                  type="datetime-local"
                  required
                  value={form.traded_at}
                  onChange={(e) => setForm({ ...form, traded_at: e.target.value })}
                />
              </Field>
              <Field label={tr("journal.field.category")}>
                <NativeSelect
                  value={form.category}
                  onChange={(v) => setForm({ ...form, category: v })}
                  options={[...CATEGORIES]}
                  labels={Object.fromEntries(CATEGORIES.map((c) => [c, tr(`cat.${c}`, c)]))}
                />
              </Field>
              <Field label={tr("journal.field.pair")}>
                <Input
                  required
                  placeholder="EUR/USD, XAU/USD, BTC/USDT"
                  value={form.pair}
                  onChange={(e) => setForm({ ...form, pair: e.target.value })}
                />
              </Field>
              <Field label={tr("journal.field.direction")}>
                <NativeSelect
                  value={form.direction}
                  onChange={(v) => setForm({ ...form, direction: v })}
                  options={[...DIRECTIONS]}
                  labels={Object.fromEntries(DIRECTIONS.map((d) => [d, tr(`dir.${d}`, d)]))}
                />
              </Field>
              <Field label={tr("journal.field.setup")}>
                <NativeSelect
                  value={form.setup_id}
                  onChange={(v) => setForm({ ...form, setup_id: v })}
                  options={setups.map((s) => s.id)}
                  labels={Object.fromEntries(setups.map((s) => [s.id, s.name]))}
                  placeholder={tr("journal.noSetup")}
                />
              </Field>
              <Field label={tr("journal.field.outcome")}>
                <NativeSelect
                  value={form.outcome}
                  onChange={(v) => setForm({ ...form, outcome: v })}
                  options={[...OUTCOMES]}
                  labels={Object.fromEntries(OUTCOMES.map((o) => [o, tr(`out.${o}`, o)]))}
                />
              </Field>
              <Field label={tr("journal.field.entry")}>
                <Input
                  inputMode="decimal"
                  value={form.entry_price}
                  onChange={(e) => setForm({ ...form, entry_price: e.target.value })}
                />
              </Field>
              <Field label={tr("journal.field.sl")}>
                <Input
                  inputMode="decimal"
                  value={form.stop_loss}
                  onChange={(e) => setForm({ ...form, stop_loss: e.target.value })}
                />
              </Field>
              <Field label={tr("journal.field.tp")}>
                <Input
                  inputMode="decimal"
                  value={form.take_profit}
                  onChange={(e) => setForm({ ...form, take_profit: e.target.value })}
                />
              </Field>
              <Field label={tr("journal.field.r")}>
                <Input
                  inputMode="decimal"
                  value={form.realized_r}
                  onChange={(e) => setForm({ ...form, realized_r: e.target.value })}
                />
              </Field>
            </div>
            <Field label={tr("journal.field.url")}>
              <Input
                type="url"
                placeholder="https://www.tradingview.com/chart/…"
                value={form.chart_url}
                onChange={(e) => setForm({ ...form, chart_url: e.target.value })}
              />
            </Field>
            <Field label={tr("journal.field.notes")}>
              <Textarea
                rows={4}
                placeholder={tr("journal.notesPlaceholder")}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {tr("journal.cancel")}
              </Button>
              <Button type="submit" disabled={upsert.isPending}>
                {upsert.isPending ? tr("journal.saving") : tr("journal.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function NativeSelect({
  value,
  onChange,
  options,
  labels,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  labels?: Record<string, string>;
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o} value={o}>
          {labels?.[o] ?? o}
        </option>
      ))}
    </select>
  );
}
