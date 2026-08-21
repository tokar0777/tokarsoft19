export const CATEGORIES = ["Crypto", "Forex", "Metals"] as const;
export type Category = (typeof CATEGORIES)[number];

export const OUTCOMES = ["Win", "Loss", "Break-Even"] as const;
export type Outcome = (typeof OUTCOMES)[number];

export const DIRECTIONS = ["Long", "Short"] as const;
export type Direction = (typeof DIRECTIONS)[number];

export const TIMEFRAMES = ["Weekly", "Monthly", "Quarterly", "Yearly"] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

export type Trade = {
  id: string;
  user_id: string;
  traded_at: string;
  category: string;
  pair: string;
  direction: string;
  setup_id: string | null;
  entry_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  realized_r: number;
  notes: string;
  chart_url: string | null;
  outcome: string;
};

export type Setup = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  confluences: string[];
  created_at: string;
};

export type RiskRule = {
  id: string;
  user_id: string;
  rule: string;
  is_active: boolean;
  created_at: string;
};

export const TIMEFRAME_DAYS: Record<Timeframe, number> = {
  Weekly: 7,
  Monthly: 30,
  Quarterly: 90,
  Yearly: 365,
};

export function filterTrades(trades: Trade[], category: string, timeframe: Timeframe): Trade[] {
  const cutoff = Date.now() - TIMEFRAME_DAYS[timeframe] * 24 * 60 * 60 * 1000;
  return trades.filter(
    (t) =>
      (category === "All" || t.category === category) && new Date(t.traded_at).getTime() >= cutoff,
  );
}

export type Stats = {
  total: number;
  wins: number;
  losses: number;
  breakEven: number;
  winRate: number;
  totalR: number;
  avgR: number;
  bestPair: string | null;
  bestPairR: number;
  bestCategory: string | null;
  bestCategoryR: number;
};

export function computeStats(trades: Trade[]): Stats {
  const wins = trades.filter((t) => t.outcome === "Win").length;
  const losses = trades.filter((t) => t.outcome === "Loss").length;
  const breakEven = trades.filter((t) => t.outcome === "Break-Even").length;
  const totalR = trades.reduce((sum, t) => sum + Number(t.realized_r ?? 0), 0);
  const decided = wins + losses;

  const byKey = (key: "pair" | "category") => {
    const map = new Map<string, number>();
    for (const t of trades) {
      map.set(t[key], (map.get(t[key]) ?? 0) + Number(t.realized_r ?? 0));
    }
    let best: string | null = null;
    let bestR = 0;
    for (const [k, v] of map) {
      if (best === null || v > bestR) {
        best = k;
        bestR = v;
      }
    }
    return { best, bestR };
  };

  const pair = byKey("pair");
  const cat = byKey("category");

  return {
    total: trades.length,
    wins,
    losses,
    breakEven,
    winRate: decided ? (wins / decided) * 100 : 0,
    totalR,
    avgR: trades.length ? totalR / trades.length : 0,
    bestPair: pair.best,
    bestPairR: pair.bestR,
    bestCategory: cat.best,
    bestCategoryR: cat.bestR,
  };
}

export function equityCurve(trades: Trade[]) {
  const sorted = [...trades].sort(
    (a, b) => new Date(a.traded_at).getTime() - new Date(b.traded_at).getTime(),
  );
  let cumulative = 0;
  return sorted.map((t) => {
    cumulative += Number(t.realized_r ?? 0);
    return {
      date: new Date(t.traded_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      r: Number(cumulative.toFixed(2)),
      pair: t.pair,
    };
  });
}

export function winLossByCategory(trades: Trade[]) {
  return CATEGORIES.map((category) => ({
    category,
    wins: trades.filter((t) => t.category === category && t.outcome === "Win").length,
    losses: trades.filter((t) => t.category === category && t.outcome === "Loss").length,
  }));
}

export function formatR(value: number): string {
  const rounded = Number(value.toFixed(2));
  return `${rounded > 0 ? "+" : ""}${rounded}R`;
}
