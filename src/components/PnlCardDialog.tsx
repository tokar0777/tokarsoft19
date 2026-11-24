import { useEffect, useMemo, useState } from "react";
import { Download, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { TIMEFRAME_DAYS, computeStats, equityCurve, filterTrades, type Trade } from "@/lib/trading";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useRequestNickname } from "@/lib/queries";

type Period = "Trade" | "Daily" | "Weekly" | "Monthly" | "Overall";
type Variant = "neon" | "bold" | "gold";
const VARIANTS: Variant[] = ["neon", "bold", "gold"];

const L = {
  EN: { tradeP: "Trade", pick: "Choose trade", all: "All", pair: "Pair", dir: "Position", btn: "PnL card", title: "Share PnL card", nick: "Nickname", week: "Week", month: "Month", save: "Save to gallery", trades: "Trades", wr: "Win rate", pnl: "PnL", day: "Day", style: "Style", setNick: "Set nickname (once)", change: "Request change", pending: "Awaiting admin approval", sent: "Change request sent to admin", saved: "Nickname saved", noTrades: "No trades yet" },
  UA: { tradeP: "Угода", pick: "Оберіть угоду", all: "Все", pair: "Пара", dir: "Позиція", btn: "PnL картка", title: "PnL картка", nick: "Нікнейм", week: "Тиждень", month: "Місяць", save: "Зберегти в галерею", trades: "Угоди", wr: "Вінрейт", pnl: "PnL", day: "День", style: "Стиль", setNick: "Встановити нікнейм (один раз)", change: "Запросити зміну", pending: "Очікує підтвердження адміна", sent: "Запит на зміну надіслано адміну", saved: "Нікнейм збережено", noTrades: "Угод ще немає" },
  RU: { tradeP: "Сделка", pick: "Выберите сделку", all: "Всё", pair: "Пара", dir: "Позиция", btn: "PnL карточка", title: "PnL карточка", nick: "Никнейм", week: "Неделя", month: "Месяц", save: "Сохранить в галерею", trades: "Сделки", wr: "Винрейт", pnl: "PnL", day: "День", style: "Стиль", setNick: "Установить никнейм (один раз)", change: "Запросить смену", pending: "Ожидает подтверждения админа", sent: "Запрос на смену отправлен админу", saved: "Никнейм сохранён", noTrades: "Сделок пока нет" },
} as const;

function draw(opts: { variant: Variant; curve: number[]; nick: string; pct: number; label: string; range: string; trades: number; wr: number; dir?: string; pair?: string; tx: Record<keyof (typeof L)["EN"], string> }) {
  const W = 1080, H = 1350;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  const win = opts.pct >= 0;
  const isLong = opts.dir === "Long";
  const isShort = opts.dir === "Short";
  const bg = g.createLinearGradient(0, 0, W, H);
  const v = opts.variant;
  if (v === "gold") {
    bg.addColorStop(0, "#090a0d");
    bg.addColorStop(1, win ? (isShort ? "#111c1a" : "#1c1608") : "#1e0c10");
  } else if (v === "bold") {
    if (win) {
      bg.addColorStop(0, isShort ? "#0d9488" : "#10b981");
      bg.addColorStop(1, isShort ? "#042f2e" : "#022c1c");
    } else {
      bg.addColorStop(0, isShort ? "#be123c" : "#ef4444");
      bg.addColorStop(1, "#240308");
    }
  } else if (win) {
    bg.addColorStop(0, "#03140c");
    bg.addColorStop(0.55, isShort ? "#064e4b" : "#064e2b");
    bg.addColorStop(1, isShort ? "#14b8a6" : "#10b981");
  } else {
    bg.addColorStop(0, "#180406");
    bg.addColorStop(0.55, isShort ? "#4c0519" : "#5c0f17");
    bg.addColorStop(1, isShort ? "#e11d48" : "#ef4444");
  }
  g.fillStyle = bg; g.fillRect(0, 0, W, H);

  // Variant-specific background geometry
  if (v === "neon") {
    const gx = isShort ? W * 0.2 : W * 0.82;
    const gy = isShort ? H * 0.65 : H * 0.28;
    const glow = g.createRadialGradient(gx, gy, 0, gx, gy, 720);
    glow.addColorStop(0, win ? (isShort ? "rgba(45,212,191,0.45)" : "rgba(52,211,153,0.48)") : "rgba(248,113,113,0.48)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = glow; g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(255,255,255,0.05)"; g.lineWidth = 1;
    for (let x = 0; x < W; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (let y = 0; y < H; y += 60) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  } else if (v === "bold") {
    g.save();
    g.fillStyle = "rgba(0,0,0,0.22)";
    g.beginPath();
    if (isShort) { g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, H * 0.42); g.lineTo(0, H * 0.22); }
    else { g.moveTo(0, H * 0.78); g.lineTo(W, H * 0.56); g.lineTo(W, H); g.lineTo(0, H); }
    g.closePath(); g.fill();
    g.restore();
  } else if (v === "gold") {
    const accent = win ? "#f0b90b" : "#f6465d";
    g.save();
    g.strokeStyle = win ? "rgba(240,185,11,0.07)" : "rgba(246,70,93,0.08)";
    g.lineWidth = 24;
    for (let x = -H; x < W; x += 100) {
      g.beginPath();
      if (isShort) { g.moveTo(x, 0); g.lineTo(x + H, H); }
      else { g.moveTo(x, H); g.lineTo(x + H, 0); }
      g.stroke();
    }
    g.restore();
    g.strokeStyle = accent; g.lineWidth = 6; g.strokeRect(40, 40, W - 80, H - 80);
    g.strokeStyle = "rgba(255,255,255,0.14)"; g.lineWidth = 2; g.strokeRect(58, 58, W - 116, H - 116);
  }

  // Direction watermark chevron or equity curve
  if (opts.dir) {
    g.save();
    g.globalAlpha = v === "bold" ? 0.14 : 0.2;
    g.strokeStyle = win ? (v === "gold" ? "#f0b90b" : "#6ee7b7") : "#fca5a5";
    g.lineWidth = 18; g.lineCap = "round"; g.lineJoin = "round";
    const cy = 790;
    if (isLong) {
      g.beginPath(); g.moveTo(140, cy + 120); g.lineTo(440, cy + 20); g.lineTo(620, cy + 80); g.lineTo(940, cy - 110); g.stroke();
      g.beginPath(); g.moveTo(860, cy - 115); g.lineTo(940, cy - 110); g.lineTo(920, cy - 30); g.stroke();
    } else {
      g.beginPath(); g.moveTo(140, cy - 110); g.lineTo(440, cy - 10); g.lineTo(620, cy - 70); g.lineTo(940, cy + 120); g.stroke();
      g.beginPath(); g.moveTo(860, cy + 125); g.lineTo(940, cy + 120); g.lineTo(920, cy + 40); g.stroke();
    }
    g.restore();
  } else if (v !== "bold") {
    g.beginPath(); g.lineWidth = 8;
    g.strokeStyle = v === "gold" ? (win ? "#f0b90b" : "#f6465d") : win ? "rgba(167,243,208,0.8)" : "rgba(254,202,202,0.8)";
    const cv = [0, ...opts.curve];
    const mn = Math.min(...cv), mx = Math.max(...cv), span = mx - mn || 1;
    cv.forEach((p, i) => {
      const x = 80 + (i * (W - 160)) / Math.max(cv.length - 1, 1);
      const y = 940 - ((p - mn) / span) * 280;
      if (i) g.lineTo(x, y); else g.moveTo(x, y);
    });
    g.stroke();
  }

  if (opts.dir) {
    const txt = `${isLong ? "▲ LONG" : "▼ SHORT"}${opts.pair ? "  ·  " + opts.pair : ""}`;
    g.font = "bold 40px 'JetBrains Mono', monospace";
    const w = g.measureText(txt).width + 64;
    g.fillStyle = isLong ? "rgba(16,185,129,0.92)" : "rgba(239,68,68,0.92)";
    g.beginPath(); g.roundRect(80, 245, w, 78, 39); g.fill();
    g.fillStyle = "#ffffff"; g.fillText(txt, 112, 298);
  }
  g.fillStyle = "#ffffff";
  g.font = "bold 56px 'JetBrains Mono', monospace";
  g.fillText("TOKARsoft19", 80, 130);
  g.font = "36px sans-serif"; g.fillStyle = "rgba(255,255,255,0.75)";
  g.fillText(`${opts.label}: ${opts.range}`, 80, 190);

  g.font = "500 40px sans-serif"; g.fillStyle = "rgba(255,255,255,0.8)";
  if (!opts.dir) g.fillText(opts.tx.pnl, 80, 380);
  const pctText = `${win ? "+" : ""}${opts.pct.toFixed(2)}%`;
  g.fillStyle = v === "bold" ? "#ffffff" : v === "gold" ? (win ? "#f0b90b" : "#f6465d") : win ? "#6ee7b7" : "#fca5a5";
  if (v === "bold") { g.font = "bold 220px 'JetBrains Mono', monospace"; g.textAlign = "center"; g.fillText(pctText, W / 2, 650); g.textAlign = "left"; }
  else { g.font = "bold 170px 'JetBrains Mono', monospace"; g.fillText(pctText, 70, 550); }

  g.fillStyle = "rgba(0,0,0,0.4)";
  g.beginPath(); g.roundRect(80, 1000, W - 160, 200, 28); g.fill();
  g.font = "34px sans-serif"; g.fillStyle = "rgba(255,255,255,0.7)";
  g.fillText(opts.tx.nick, 120, 1065);
  g.fillText(opts.dir ? opts.tx.pair : opts.tx.trades, 540, 1065);
  g.fillText(opts.dir ? opts.tx.dir : opts.tx.wr, 800, 1065);
  g.font = "bold 48px 'JetBrains Mono', monospace"; g.fillStyle = "#ffffff";
  g.fillText((opts.nick || "—").slice(0, 14), 120, 1145);
  g.fillText(opts.dir ? (opts.pair || "—").slice(0, 10) : String(opts.trades), 540, 1145);
  g.fillStyle = opts.dir ? (isLong ? "#34d399" : "#f87171") : "#ffffff";
  g.fillText(opts.dir ? opts.dir.toUpperCase() : `${opts.wr.toFixed(0)}%`, 800, 1145);

  g.font = "28px sans-serif"; g.fillStyle = "rgba(255,255,255,0.5)";
  g.fillText(opts.range, 80, 1280);
  return c;
}

export function PnlCardDialog({ trades }: { trades: Trade[] }) {
  const { lang } = useI18n();
  const tx = L[lang as keyof typeof L] ?? L.EN;
  const { session } = useAuth();
  const { data: access } = useProfile(!!session);
  const profile = access?.profile;
  const reqNick = useRequestNickname();
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<Period>("Weekly");
  const [variant, setVariant] = useState<Variant>("neon");
  const [draft, setDraft] = useState("");
  const [url, setUrl] = useState<string | null>(null);
  const nick = profile?.nickname ?? "";

  const recent = useMemo(() => [...trades].filter((t) => t.outcome !== "Missed").sort((a, b) => b.traded_at.localeCompare(a.traded_at)).slice(0, 50), [trades]);
  const [tradeId, setTradeId] = useState<string>("");
  const one = period === "Trade" ? recent.find((t) => t.id === tradeId) ?? recent[0] : undefined;
  const periodTrades = useMemo(
    () => (period === "Trade" ? (one ? [one] : []) : filterTrades(trades, "All", period)),
    [trades, period, one],
  );
  const stats = useMemo(() => computeStats(periodTrades), [periodTrades]);
  const curve = useMemo(() => equityCurve(periodTrades).map((p) => p.r), [periodTrades]);
  const pct = stats.totalR; // 1R = 1%
  const label = period === "Trade" ? tx.tradeP : period === "Daily" ? tx.day : period === "Weekly" ? tx.week : period === "Monthly" ? tx.month : tx.all;
  const range = useMemo(() => {
    if (period === "Trade") return one ? new Date(one.traded_at).toLocaleDateString("uk-UA") : "—";
    const end = new Date();
    const f = (d: Date, y = true) => d.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", ...(y ? { year: "numeric" } : {}) });
    if (period === "Overall") return f(end);
    const start = new Date(end.getTime() - TIMEFRAME_DAYS[period as Exclude<Period, "Trade">] * 86400000);
    return period === "Daily" ? f(end) : `${f(start, false)} – ${f(end)}`;
  }, [period, open, one]);

  useEffect(() => {
    if (!open) return;
    setUrl(draw({ variant, curve, nick, pct, label, range, trades: stats.total, wr: stats.winRate, ...(one ? { dir: one.direction, pair: one.pair } : {}), tx }).toDataURL("image/png"));
  }, [open, variant, curve, nick, pct, label, range, stats.total, stats.winRate, tx, one]);

  const submitNick = () =>
    reqNick.mutate(draft, {
      onSuccess: (r) => { toast.success(r === "pending" ? tx.sent : tx.saved); setDraft(""); },
      onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
    });

  const fileName = `tokarsoft19-pnl-${period.toLowerCase()}.png`;
  const save = async () => {
    if (!url) return;
    try {
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], fileName, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file] }); return; }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    }
    const a = document.createElement("a");
    a.href = url; a.download = fileName; a.click();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Share2 className="mr-2 h-4 w-4" />{tx.btn}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-md">
        <DialogHeader><DialogTitle>{tx.title}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-5 gap-1.5">
          {(["Trade", "Daily", "Weekly", "Monthly", "Overall"] as Period[]).map((p) => (
            <Button key={p} variant={period === p ? "default" : "outline"} size="sm" className="px-1.5 text-xs" onClick={() => setPeriod(p)}>
              {p === "Trade" ? tx.tradeP : p === "Daily" ? tx.day : p === "Weekly" ? tx.week : p === "Monthly" ? tx.month : tx.all}
            </Button>
          ))}
        </div>
        {period === "Trade" && (
          <div className="space-y-1">
            <Label>{tx.pick}</Label>
            {recent.length === 0 ? (
              <p className="text-xs text-muted-foreground">{tx.noTrades}</p>
            ) : (
              <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={one?.id ?? ""} onChange={(e) => setTradeId(e.target.value)}>
                {recent.map((t) => (
                  <option key={t.id} value={t.id}>{new Date(t.traded_at).toLocaleDateString("uk-UA")} · {t.pair} · {t.direction} · {Number(t.realized_r) > 0 ? "+" : ""}{Number(t.realized_r)}R</option>
                ))}
              </select>
            )}
          </div>
        )}
        <div className="space-y-1">
          <Label>{tx.style}</Label>
          <div className="grid grid-cols-3 gap-2">
            {VARIANTS.map((v) => (
              <Button key={v} variant={variant === v ? "default" : "outline"} size="sm" onClick={() => setVariant(v)} className="capitalize">{v}</Button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="pnl-nick">{nick ? `${tx.nick}: @${nick}` : tx.setNick}</Label>
          {profile?.pending_nickname ? (
            <p className="text-xs text-muted-foreground">@{profile.pending_nickname} — {tx.pending}</p>
          ) : (
            <div className="flex gap-2">
              <Input id="pnl-nick" value={draft} maxLength={14} onChange={(e) => setDraft(e.target.value)} />
              <Button size="sm" variant="outline" disabled={draft.trim().length < 2 || reqNick.isPending} onClick={submitNick}>
                {nick ? tx.change : "OK"}
              </Button>
            </div>
          )}
        </div>
        {url && <img src={url} alt="PnL" className="w-full rounded-lg border border-border" />}
        <Button onClick={save} className="w-full"><Download className="mr-2 h-4 w-4" />{tx.save}</Button>
      </DialogContent>
    </Dialog>
  );
}
