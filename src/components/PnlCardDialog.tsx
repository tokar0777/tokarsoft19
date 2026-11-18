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

type Period = "Daily" | "Weekly" | "Monthly";
type Variant = "neon" | "minimal" | "bold" | "gold" | "stripes";
const VARIANTS: Variant[] = ["neon", "minimal", "bold", "gold", "stripes"];

const L = {
  EN: { btn: "PnL card", title: "Share PnL card", nick: "Nickname", week: "Week", month: "Month", save: "Save to gallery", share: "Share", trades: "Trades", wr: "Win rate", pnl: "PnL", wk: "7 days", mo: "30 days", day: "Day", d1: "24h", style: "Style", setNick: "Set nickname (once)", change: "Request change", pending: "Awaiting admin approval", sent: "Change request sent to admin", saved: "Nickname saved" },
  UA: { btn: "PnL картка", title: "PnL картка", nick: "Нікнейм", week: "Тиждень", month: "Місяць", save: "Зберегти в галерею", share: "Поділитися", trades: "Угоди", wr: "Вінрейт", pnl: "PnL", wk: "7 днів", mo: "30 днів", day: "День", d1: "24 год", style: "Стиль", setNick: "Встановити нікнейм (один раз)", change: "Запросити зміну", pending: "Очікує підтвердження адміна", sent: "Запит на зміну надіслано адміну", saved: "Нікнейм збережено" },
  RU: { btn: "PnL карточка", title: "PnL карточка", nick: "Никнейм", week: "Неделя", month: "Месяц", save: "Сохранить в галерею", share: "Поделиться", trades: "Сделки", wr: "Винрейт", pnl: "PnL", wk: "7 дней", mo: "30 дней", day: "День", d1: "24 ч", style: "Стиль", setNick: "Установить никнейм (один раз)", change: "Запросить смену", pending: "Ожидает подтверждения админа", sent: "Запрос на смену отправлен админу", saved: "Никнейм сохранён" },
} as const;

function draw(opts: { variant: Variant; curve: number[]; nick: string; pct: number; label: string; range: string; trades: number; wr: number; tx: Record<keyof (typeof L)["EN"], string> }) {
  const W = 1080, H = 1350;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  const win = opts.pct >= 0;
  const bg = g.createLinearGradient(0, 0, W, H);
  const v = opts.variant;
  if (v === "gold") { bg.addColorStop(0, "#0b0b0b"); bg.addColorStop(1, "#1c1608"); }
  else if (v === "stripes") { bg.addColorStop(0, win ? "#052e1c" : "#2e0509"); bg.addColorStop(1, win ? "#0d5c3a" : "#5c0d14"); }
  else if (v === "minimal") { bg.addColorStop(0, "#0b0e14"); bg.addColorStop(1, win ? "#0f2a1f" : "#2a0f12"); }
  else if (v === "bold") { bg.addColorStop(0, win ? "#10b981" : "#ef4444"); bg.addColorStop(1, win ? "#022c1c" : "#2c0206"); }
  else if (win) { bg.addColorStop(0, "#03140c"); bg.addColorStop(0.55, "#064e2b"); bg.addColorStop(1, "#10b981"); }
  else { bg.addColorStop(0, "#1a0406"); bg.addColorStop(0.55, "#5c0f17"); bg.addColorStop(1, "#ef4444"); }
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // glow
  const glow = g.createRadialGradient(W * 0.8, H * 0.3, 0, W * 0.8, H * 0.3, 700);
  glow.addColorStop(0, win ? "rgba(52,211,153,0.45)" : "rgba(248,113,113,0.45)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  if (v === "neon" || v === "bold") { g.fillStyle = glow; g.fillRect(0, 0, W, H); }
  // grid
  g.strokeStyle = "rgba(255,255,255,0.05)"; g.lineWidth = 1;
  if (v === "minimal") { g.fillStyle = win ? "#10b981" : "#ef4444"; g.fillRect(0, 0, 16, H); }
  if (v === "stripes") { g.save(); g.strokeStyle = win ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)"; g.lineWidth = 40; for (let x = -H; x < W; x += 110) { g.beginPath(); g.moveTo(x, H); g.lineTo(x + H, 0); g.stroke(); } g.restore(); }
  if (v === "gold") { g.strokeStyle = "#f0b90b"; g.lineWidth = 6; g.strokeRect(40, 40, W - 80, H - 80); }
  g.strokeStyle = "rgba(255,255,255,0.05)"; g.lineWidth = 1;
  if (v === "neon" || v === "minimal") for (let x = 0; x < W; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  if (v === "neon" || v === "minimal") for (let y = 0; y < H; y += 60) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  // chart line
  g.beginPath(); g.lineWidth = 8; g.strokeStyle = win ? "rgba(167,243,208,0.8)" : "rgba(254,202,202,0.8)";
  const cv = [0, ...opts.curve];
  const mn = Math.min(...cv), mx = Math.max(...cv), span = mx - mn || 1;
  if (v === "gold") g.strokeStyle = "#f0b90b";
  if (v !== "bold") {
    cv.forEach((p, i) => { const x = 80 + (i * (W - 160)) / Math.max(cv.length - 1, 1); const y = 940 - ((p - mn) / span) * 280; i ? g.lineTo(x, y) : g.moveTo(x, y); });
    g.stroke();
  }

  g.fillStyle = "#ffffff";
  g.font = "bold 56px 'JetBrains Mono', monospace";
  g.fillText("TOKARsoft19", 80, 130);
  g.font = "36px sans-serif"; g.fillStyle = "rgba(255,255,255,0.75)";
  g.fillText(`${opts.label}: ${opts.range}`, 80, 190);

  g.font = "500 40px sans-serif"; g.fillStyle = "rgba(255,255,255,0.8)";
  g.fillText(opts.tx.pnl, 80, 380);
  const pctText = `${win ? "+" : ""}${opts.pct.toFixed(2)}%`;
  g.fillStyle = v === "bold" ? "#ffffff" : v === "gold" ? (win ? "#f0b90b" : "#f6465d") : win ? "#6ee7b7" : "#fca5a5";
  if (v === "bold") { g.font = "bold 230px 'JetBrains Mono', monospace"; g.textAlign = "center"; g.fillText(pctText, W / 2, 720); g.textAlign = "left"; }
  else { g.font = "bold 170px 'JetBrains Mono', monospace"; g.fillText(pctText, 70, 560); }

  g.fillStyle = "rgba(0,0,0,0.35)";
  g.beginPath(); g.roundRect(80, 1000, W - 160, 200, 28); g.fill();
  g.font = "34px sans-serif"; g.fillStyle = "rgba(255,255,255,0.7)";
  g.fillText(opts.tx.nick, 120, 1065); g.fillText(opts.tx.trades, 560, 1065); g.fillText(opts.tx.wr, 800, 1065);
  g.font = "bold 50px 'JetBrains Mono', monospace"; g.fillStyle = "#ffffff";
  g.fillText((opts.nick || "—").slice(0, 14), 120, 1145);
  g.fillText(String(opts.trades), 560, 1145);
  g.fillText(`${opts.wr.toFixed(0)}%`, 800, 1145);

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

  const periodTrades = useMemo(() => filterTrades(trades, "All", period), [trades, period]);
  const stats = useMemo(() => computeStats(periodTrades), [periodTrades]);
  const curve = useMemo(() => equityCurve(periodTrades).map((p) => p.r), [periodTrades]);
  const pct = stats.totalR; // 1R = 1%
  const label = period === "Daily" ? tx.day : period === "Weekly" ? tx.week : tx.month;
  const range = useMemo(() => {
    const end = new Date();
    const start = new Date(end.getTime() - TIMEFRAME_DAYS[period] * 86400000);
    const f = (d: Date, y = true) => d.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", ...(y ? { year: "numeric" } : {}) });
    return period === "Daily" ? f(end) : `${f(start, false)} – ${f(end)}`;
  }, [period, open]);

  useEffect(() => {
    if (!open) return;
    setUrl(draw({ variant, curve, nick, pct, label, range, trades: stats.total, wr: stats.winRate, tx }).toDataURL("image/png"));
  }, [open, variant, curve, nick, pct, label, range, stats.total, stats.winRate, tx]);

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
        <div className="grid grid-cols-3 gap-2">
          {(["Daily", "Weekly", "Monthly"] as Period[]).map((p) => (
            <Button key={p} variant={period === p ? "default" : "outline"} size="sm" onClick={() => setPeriod(p)}>
              {p === "Daily" ? tx.day : p === "Weekly" ? tx.week : tx.month}
            </Button>
          ))}
        </div>
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
