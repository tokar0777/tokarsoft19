import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, ChevronLeft, ChevronRight, Percent, Sigma, Target, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useTrades } from "@/lib/queries";
import {
  CATEGORIES,
  TIMEFRAMES,
  computeStats,
  dailyPnLByMonth,
  equityCurve,
  filterTrades,
  formatR,
  winLossByCategory,
  type Timeframe,
  type Trade,
} from "@/lib/trading";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — TOKARsoft19" },
      {
        name: "description",
        content:
          "Smart Money Concepts trading analytics: win rate, realized R, equity curve and win/loss breakdown by asset class.",
      },
      { property: "og:title", content: "Dashboard — TOKARsoft19" },
      {
        property: "og:description",
        content: "SMC trading analytics: win rate, realized R and equity curve by asset class.",
      },
    ],
  }),
  component: DashboardPage,
});

const FILTERS = ["All", ...CATEGORIES] as const;

function DashboardPage() {
  const { session } = useAuth();
  const { t } = useI18n();
  const { data: trades = [], isLoading } = useTrades(!!session);
  const [category, setCategory] = useState<string>("All");
  const [timeframe, setTimeframe] = useState<Timeframe>("Quarterly");

  const filtered = useMemo(
    () => filterTrades(trades, category, timeframe),
    [trades, category, timeframe],
  );
  const stats = useMemo(() => computeStats(filtered), [filtered]);
  const curve = useMemo(() => equityCurve(filtered), [filtered]);
  const byCategory = useMemo(() => winLossByCategory(filtered), [filtered]);
  const tableRows = useMemo(
    () =>
      TIMEFRAMES.map((tf) => {
        const s = computeStats(filterTrades(trades, category, tf));
        return { tf, ...s };
      }),
    [trades, category],
  );

  return (
    <AppShell title={t("dash.title")} subtitle={t("dash.subtitle")}>
      <div className="mb-6 flex flex-col gap-3 rounded-lg border border-border bg-card p-3 md:flex-row md:items-center md:justify-between">
        <SegmentGroup
          label={t("dash.assetClass")}
          options={FILTERS as unknown as string[]}
          renderOption={(o) => (o === "All" ? t("f.All") : t(`cat.${o}`, o))}
          value={category}
          onChange={setCategory}
        />
        <SegmentGroup
          label={t("dash.period")}
          options={TIMEFRAMES as unknown as string[]}
          renderOption={(o) => t(`tf.${o}`, o)}
          value={timeframe}
          onChange={(v) => setTimeframe(v as Timeframe)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Activity}
          label={t("dash.totalTrades")}
          value={String(stats.total)}
          hint={`${stats.wins}W · ${stats.losses}L · ${stats.breakEven}BE · ${stats.missed} ${t("dash.missed")}`}
        />
        <MetricCard
          icon={Percent}
          label={t("dash.winRate")}
          value={`${stats.winRate.toFixed(1)}%`}
          hint={t("dash.winRateHint")}
          tone={stats.winRate >= 50 ? "long" : "short"}
        />
        <MetricCard
          icon={Sigma}
          label={t("dash.totalR")}
          value={formatR(stats.totalR)}
          hint={t("dash.totalRHint")}
          tone={stats.totalR >= 0 ? "long" : "short"}
        />
        <MetricCard
          icon={Target}
          label={t("dash.avgR")}
          value={formatR(stats.avgR)}
          hint={t("dash.avgRHint")}
          tone={stats.avgR >= 0 ? "long" : "short"}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide">{t("dash.equity")}</h2>
            <span className="tabular text-xs text-muted-foreground">{filtered.length} {t("dash.trades")}</span>
          </div>
          {curve.length === 0 ? (
            <EmptyState loading={isLoading} />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={curve}>
                  <defs>
                    <linearGradient id="equity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} width={38} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      color: "var(--color-popover-foreground)",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="r"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2}
                    fill="url(#equity)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold tracking-wide">{t("dash.winLoss")}</h2>
          {filtered.length === 0 ? (
            <EmptyState loading={isLoading} />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCategory}>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="category" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} width={28} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: "var(--color-muted)" }}
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      color: "var(--color-popover-foreground)",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="wins" fill="var(--color-chart-1)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="losses" fill="var(--color-chart-2)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <MetricCard
          icon={Trophy}
          label={t("dash.bestPair")}
          value={stats.bestPair ?? "—"}
          hint={stats.bestPair ? `${formatR(stats.bestPairR)} ${t("dash.realized")}` : t("dash.noTradesRange")}
          tone="long"
        />
        <MetricCard
          icon={Trophy}
          label={t("dash.bestClass")}
          value={stats.bestCategory ?? "—"}
          hint={stats.bestCategory ? `${formatR(stats.bestCategoryR)} ${t("dash.realized")}` : t("dash.noTradesRange")}
          tone="long"
        />
      </div>

      <div className="mt-4 rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide">{t("dash.table")}</h2>
          <span className="text-xs text-muted-foreground">{t("dash.profitHint")}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <th className="py-2 pr-4 font-medium">{t("dash.tf")}</th>
                <th className="py-2 pr-4 font-medium">{t("dash.totalTrades")}</th>
                <th className="py-2 pr-4 font-medium">{t("dash.wl")}</th>
                <th className="py-2 pr-4 font-medium">{t("dash.winRate")}</th>
                <th className="py-2 pr-4 font-medium">{t("dash.totalR")}</th>
                <th className="py-2 font-medium">{t("dash.profit")}</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr key={row.tf} className="border-b border-border/50 last:border-0">
                  <td className="py-2.5 pr-4 font-medium">{t(`tf.${row.tf}`, row.tf)}</td>
                  <td className="tabular py-2.5 pr-4">
                    {row.total}
                    {row.missed > 0 && (
                      <span className="ml-1 text-xs text-muted-foreground">+{row.missed} {t("dash.missed")}</span>
                    )}
                  </td>
                  <td className="tabular py-2.5 pr-4 text-muted-foreground">
                    {row.wins} / {row.losses} / {row.breakEven}
                  </td>
                  <td className="tabular py-2.5 pr-4">{row.winRate.toFixed(1)}%</td>
                  <td className="tabular py-2.5 pr-4">{formatR(row.totalR)}</td>
                  <td
                    className={cn(
                      "tabular py-2.5 font-semibold",
                      row.totalR > 0 && "text-long",
                      row.totalR < 0 && "text-short",
                    )}
                  >
                    {row.totalR > 0 ? "+" : ""}
                    {row.totalR.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-card p-5">
        <PnLCalendar trades={trades} />
      </div>
    </AppShell>
  );
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function PnLCalendar({ trades }: { trades: Trade[] }) {
  const { t, lang } = useI18n();
  const [cursor, setCursor] = useState(() => new Date());
  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const days = useMemo(() => dailyPnLByMonth(trades, year, month), [trades, year, month]);
  const monthTotal = useMemo(() => days.reduce((sum, d) => sum + d.totalR, 0), [days]);
  const monthTrades = useMemo(() => days.reduce((sum, d) => sum + d.trades, 0), [days]);

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const leadOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthLabel = cursor.toLocaleDateString(
    lang === "UA" ? "uk-UA" : lang === "RU" ? "ru-RU" : "en-US",
    { year: "numeric", month: "long" },
  );

  const prevMonth = () => setCursor(new Date(year, month - 1, 1));
  const nextMonth = () => setCursor(new Date(year, month + 1, 1));

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-wide">{t("dash.dailyPnL")}</h2>
          <p className="text-xs text-muted-foreground">{t("dash.dailyPnLHint")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="min-w-[120px] text-center text-sm font-medium">{monthLabel}</span>
          <button
            onClick={nextMonth}
            className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-[10px] uppercase tracking-wider text-muted-foreground"
          >
            {d}
          </div>
        ))}
        {Array.from({ length: leadOffset }).map((_, i) => (
          <div key={`lead-${i}`} className="aspect-square rounded-md bg-muted/30" />
        ))}
        {days.map((day) => (
          <div
            key={day.date}
            className={cn(
              "flex aspect-square flex-col items-center justify-center rounded-md border text-xs transition-colors",
              day.trades === 0
                ? "border-border/50 bg-card"
                : day.totalR > 0
                  ? "border-long/30 bg-long/10 text-long"
                  : day.totalR < 0
                    ? "border-short/30 bg-short/10 text-short"
                    : "border-border/50 bg-muted/30 text-muted-foreground",
            )}
          >
            <span className="font-medium">{day.day}</span>
            {day.trades > 0 && (
              <span className="tabular mt-0.5 text-[10px]">
                {day.totalR > 0 ? "+" : ""}
                {day.totalR.toFixed(2)}%
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
        <span>
          {t("dash.monthTotal")}:{" "}
          <span
            className={cn(
              "font-semibold",
              monthTotal > 0 && "text-long",
              monthTotal < 0 && "text-short",
            )}
          >
            {monthTotal > 0 ? "+" : ""}
            {monthTotal.toFixed(2)}%
          </span>
        </span>
        <span>
          {monthTrades} {t("dash.tradesCount")}
        </span>
      </div>
    </div>
  );
}

function SegmentGroup({
  label,
  options,
  value,
  onChange,
  renderOption,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  renderOption?: (v: string) => string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:block">
        {label}
      </span>
      <div className="flex flex-wrap gap-1 rounded-md bg-muted p-1">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={cn(
              "rounded px-3 py-1.5 text-xs font-medium transition-colors",
              value === opt
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {renderOption ? renderOption(opt) : opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint: string;
  tone?: "long" | "short";
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p
        className={cn(
          "tabular mt-3 text-2xl font-semibold",
          tone === "long" && "text-long",
          tone === "short" && "text-short",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function EmptyState({ loading }: { loading: boolean }) {
  const { t } = useI18n();
  return (
    <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
      {loading ? t("dash.loading") : t("dash.noMatch")}
    </div>
  );
}
