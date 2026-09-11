export const CATEGORIES = ["Crypto", "Forex", "Metals"] as const;
export type Category = (typeof CATEGORIES)[number];

/** Default trading pairs grouped by asset class. Users can add more (stored locally). */
export const DEFAULT_PAIRS: Record<Category, string[]> = {
  Forex: ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD"],
  Metals: ["XAUUSD", "XAGUSD"],
  Crypto: ["BTCUSDT", "ETHUSDT", "SOLUSDT"],
};

const CUSTOM_PAIRS_KEY = "tokarsoft19-custom-pairs";

export function loadCustomPairs(): Record<Category, string[]> {
  const empty: Record<Category, string[]> = { Crypto: [], Forex: [], Metals: [] };
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(CUSTOM_PAIRS_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<Record<Category, string[]>>;
    for (const c of CATEGORIES) {
      if (Array.isArray(parsed[c])) empty[c] = parsed[c]!.map(String);
    }
  } catch {
    /* ignore malformed storage */
  }
  return empty;
}

export function saveCustomPairs(pairs: Record<Category, string[]>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CUSTOM_PAIRS_KEY, JSON.stringify(pairs));
}

export function normalizePair(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

/** Guess the asset class for a pair symbol. */
export function categoryForPair(
  pair: string,
  custom?: Record<Category, string[]>,
): Category | null {
  const p = normalizePair(pair);
  for (const c of CATEGORIES) {
    if (DEFAULT_PAIRS[c].includes(p) || custom?.[c]?.includes(p)) return c;
  }
  if (/^X(AU|AG|PT|PD)/.test(p)) return "Metals";
  if (/(USDT|USDC|BTC|ETH)$/.test(p)) return "Crypto";
  return null;
}

export const OUTCOMES = ["Win", "Loss", "Break-Even", "Missed"] as const;
export type Outcome = (typeof OUTCOMES)[number];

export const DIRECTIONS = ["Long", "Short"] as const;
export type Direction = (typeof DIRECTIONS)[number];

export const TIMEFRAMES = ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly", "Overall"] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

export type Trade = {
  id: string;
  user_id: string;
  traded_at: string;
  category: string;
  pair: string;
  direction: string;
  setup_id: string | null;
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
  Daily: 1,
  Weekly: 7,
  Monthly: 30,
  Quarterly: 90,
  Yearly: 365,
  Overall: Number.POSITIVE_INFINITY,
};

/** Trades that were never entered ("Missed") are excluded from performance metrics. */
export function isCounted(trade: Trade): boolean {
  return trade.outcome !== "Missed";
}

export function filterTrades(trades: Trade[], category: string, timeframe: Timeframe): Trade[] {
  const days = TIMEFRAME_DAYS[timeframe];
  const cutoff = Number.isFinite(days) ? Date.now() - days * 24 * 60 * 60 * 1000 : -Infinity;
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
  missed: number;
  winRate: number;
  totalR: number;
  avgR: number;
  bestPair: string | null;
  bestPairR: number;
  bestCategory: string | null;
  bestCategoryR: number;
};

export function computeStats(all: Trade[]): Stats {
  const trades = all.filter(isCounted);
  const missed = all.length - trades.length;
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
    missed,
    winRate: decided ? (wins / decided) * 100 : 0,
    totalR: Number(totalR.toFixed(2)),
    avgR: trades.length ? totalR / trades.length : 0,
    bestPair: pair.best,
    bestPairR: pair.bestR,
    bestCategory: cat.best,
    bestCategoryR: cat.bestR,
  };
}

export function equityCurve(trades: Trade[]) {
  const sorted = [...trades]
    .filter(isCounted)
    .sort((a, b) => new Date(a.traded_at).getTime() - new Date(b.traded_at).getTime());
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

export type DailyPnL = {
  date: string;
  day: number;
  totalR: number;
  trades: number;
  wins: number;
  losses: number;
};

/** Group counted trades into daily P&L buckets for a given calendar month. */
export function dailyPnLByMonth(trades: Trade[], year: number, month: number): DailyPnL[] {
  const filtered = trades.filter(isCounted);
  const map = new Map<string, DailyPnL>();

  for (const t of filtered) {
    const d = new Date(t.traded_at);
    if (d.getFullYear() !== year || d.getMonth() !== month) continue;
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const r = Number(t.realized_r ?? 0);
    const existing = map.get(key);
    if (existing) {
      existing.totalR += r;
      existing.trades += 1;
      if (t.outcome === "Win") existing.wins += 1;
      if (t.outcome === "Loss") existing.losses += 1;
    } else {
      map.set(key, {
        date: key,
        day: d.getDate(),
        totalR: r,
        trades: 1,
        wins: t.outcome === "Win" ? 1 : 0,
        losses: t.outcome === "Loss" ? 1 : 0,
      });
    }
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const result: DailyPnL[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    result.push(map.get(key) ?? { date: key, day, totalR: 0, trades: 0, wins: 0, losses: 0 });
  }
  return result;
}

/** Parse a user-typed number safely. Accepts "1,5", spaces, and returns null when empty/invalid. */
export function parseOptionalNumber(input: string): number | null {
  const raw = input.replace(/\s/g, "").replace(",", ".");
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * Parse a realized R:R value from free text.
 * Accepts "2", "2.5", "-1", "1,5", "1/2", "1:2", "1R", "+3R".
 * Ratio forms are resolved as reward / risk. Returns 0 when unparseable.
 */
export function parseRValue(input: string): number {
  const raw = input.trim().replace(/\s/g, "").replace(/[rR]$/, "").replace(",", ".");
  if (raw === "") return 0;

  const ratio = raw.match(/^([+-]?\d*\.?\d+)[/:]([+-]?\d*\.?\d+)$/);
  if (ratio) {
    const risk = Number(ratio[1]);
    const reward = Number(ratio[2]);
    if (Number.isFinite(risk) && Number.isFinite(reward) && risk !== 0) {
      return Number((reward / risk).toFixed(4));
    }
    return 0;
  }

  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}
