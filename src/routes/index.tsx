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
import { Activity, Percent, Sigma, Target, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useTrades } from "@/lib/queries";
import {
  CATEGORIES,
  TIMEFRAMES,
  computeStats,
  equityCurve,
  filterTrades,
  formatR,
  winLossByCategory,
  type Timeframe,
} from "@/lib/trading";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
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

  return (
    <AppShell title="Dashboard / Statistics" subtitle="Performance analytics across your SMC executions">
      <div className="mb-6 flex flex-col gap-3 rounded-lg border border-border bg-card p-3 md:flex-row md:items-center md:justify-between">
        <SegmentGroup
          label="Asset class"
          options={FILTERS as unknown as string[]}
          value={category}
          onChange={setCategory}
        />
        <SegmentGroup
          label="Period"
          options={TIMEFRAMES as unknown as string[]}
          value={timeframe}
          onChange={(v) => setTimeframe(v as Timeframe)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Activity}
          label="Total trades"
          value={String(stats.total)}
          hint={`${stats.wins}W · ${stats.losses}L · ${stats.breakEven}BE`}
        />
        <MetricCard
          icon={Percent}
          label="Win rate"
          value={`${stats.winRate.toFixed(1)}%`}
          hint="Excludes break-even trades"
          tone={stats.winRate >= 50 ? "long" : "short"}
        />
        <MetricCard
          icon={Sigma}
          label="Total R realized"
          value={formatR(stats.totalR)}
          hint="Cumulative risk multiples"
          tone={stats.totalR >= 0 ? "long" : "short"}
        />
        <MetricCard
          icon={Target}
          label="Average R / trade"
          value={formatR(stats.avgR)}
          hint="Expectancy per execution"
          tone={stats.avgR >= 0 ? "long" : "short"}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide">Cumulative equity curve (R)</h2>
            <span className="tabular text-xs text-muted-foreground">{filtered.length} trades</span>
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
          <h2 className="mb-4 text-sm font-semibold tracking-wide">Win / loss by asset class</h2>
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
          label="Best performing pair"
          value={stats.bestPair ?? "—"}
          hint={stats.bestPair ? `${formatR(stats.bestPairR)} realized` : "No trades in range"}
          tone="long"
        />
        <MetricCard
          icon={Trophy}
          label="Best performing asset class"
          value={stats.bestCategory ?? "—"}
          hint={stats.bestCategory ? `${formatR(stats.bestCategoryR)} realized` : "No trades in range"}
          tone="long"
        />
      </div>
    </AppShell>
  );
}

function SegmentGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
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
            {opt}
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
  return (
    <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
      {loading ? "Loading data…" : "No trades match the current filters."}
    </div>
  );
}
