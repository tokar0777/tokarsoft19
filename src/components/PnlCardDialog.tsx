import { useEffect, useMemo, useState } from "react";
import { Download, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { computeStats, filterTrades, type Trade } from "@/lib/trading";
import { cn } from "@/lib/utils";

type Period = "Weekly" | "Monthly";
const NICK_KEY = "tokarsoft19-pnl-nick";

const L = {
  EN: { btn: "PnL card", title: "Share PnL card", nick: "Nickname", week: "Week", month: "Month", save: "Save to gallery", share: "Share", trades: "Trades", wr: "Win rate", pnl: "PnL", wk: "7 days", mo: "30 days" },
  UA: { btn: "PnL картка", title: "PnL картка", nick: "Нікнейм", week: "Тиждень", month: "Місяць", save: "Зберегти в галерею", share: "Поділитися", trades: "Угоди", wr: "Вінрейт", pnl: "PnL", wk: "7 днів", mo: "30 днів" },
  RU: { btn: "PnL карточка", title: "PnL карточка", nick: "Никнейм", week: "Неделя", month: "Месяц", save: "Сохранить в галерею", share: "Поделиться", trades: "Сделки", wr: "Винрейт", pnl: "PnL", wk: "7 дней", mo: "30 дней" },
} as const;

function draw(opts: { nick: string; pct: number; label: string; range: string; trades: number; wr: number; tx: (typeof L)["EN"] }) {
  const W = 1080, H = 1350;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  const win = opts.pct >= 0;
  const bg = g.createLinearGradient(0, 0, W, H);
  if (win) { bg.addColorStop(0, "#03140c"); bg.addColorStop(0.55, "#064e2b"); bg.addColorStop(1, "#10b981"); }
  else { bg.addColorStop(0, "#1a0406"); bg.addColorStop(0.55, "#5c0f17"); bg.addColorStop(1, "#ef4444"); }
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // glow
  const glow = g.createRadialGradient(W * 0.8, H * 0.3, 0, W * 0.8, H * 0.3, 700);
  glow.addColorStop(0, win ? "rgba(52,211,153,0.45)" : "rgba(248,113,113,0.45)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = glow; g.fillRect(0, 0, W, H);
  // grid
  g.strokeStyle = "rgba(255,255,255,0.05)"; g.lineWidth = 1;
  for (let x = 0; x < W; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for (let y = 0; y < H; y += 60) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  // chart line
  g.beginPath(); g.lineWidth = 8; g.strokeStyle = win ? "rgba(167,243,208,0.8)" : "rgba(254,202,202,0.8)";
  const pts = win ? [0.9, 0.85, 0.88, 0.75, 0.78, 0.62, 0.66, 0.5] : [0.5, 0.55, 0.52, 0.65, 0.62, 0.76, 0.72, 0.88];
  pts.forEach((p, i) => { const x = 80 + (i * (W - 160)) / (pts.length - 1); const y = 650 + p * 300 - 150; i ? g.lineTo(x, y) : g.moveTo(x, y); });
  g.stroke();

  g.fillStyle = "#ffffff";
  g.font = "bold 56px 'JetBrains Mono', monospace";
  g.fillText("TOKARsoft19", 80, 130);
  g.font = "36px sans-serif"; g.fillStyle = "rgba(255,255,255,0.75)";
  g.fillText(`${opts.label} · ${opts.range}`, 80, 190);

  g.font = "500 40px sans-serif"; g.fillStyle = "rgba(255,255,255,0.8)";
  g.fillText(opts.tx.pnl, 80, 380);
  g.font = "bold 180px 'JetBrains Mono', monospace"; g.fillStyle = win ? "#6ee7b7" : "#fca5a5";
  g.fillText(`${win ? "+" : ""}${opts.pct.toFixed(2)}%`, 70, 560);

  g.fillStyle = "rgba(0,0,0,0.35)";
  g.beginPath(); g.roundRect(80, 1000, W - 160, 200, 28); g.fill();
  g.font = "34px sans-serif"; g.fillStyle = "rgba(255,255,255,0.7)";
  g.fillText(opts.tx.nick, 120, 1065); g.fillText(opts.tx.trades, 560, 1065); g.fillText(opts.tx.wr, 800, 1065);
  g.font = "bold 50px 'JetBrains Mono', monospace"; g.fillStyle = "#ffffff";
  g.fillText((opts.nick || "—").slice(0, 14), 120, 1145);
  g.fillText(String(opts.trades), 560, 1145);
  g.fillText(`${opts.wr.toFixed(0)}%`, 800, 1145);

  g.font = "28px sans-serif"; g.fillStyle = "rgba(255,255,255,0.5)";
  g.fillText(new Date().toLocaleDateString(), 80, 1280);
  return c;
}

export function PnlCardDialog({ trades }: { trades: Trade[] }) {
  const { lang } = useI18n();
  const tx = L[lang as keyof typeof L] ?? L.EN;
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<Period>("Weekly");
  const [nick, setNick] = useState("");
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => { setNick(localStorage.getItem(NICK_KEY) ?? ""); }, []);

  const stats = useMemo(() => computeStats(filterTrades(trades, "All", period)), [trades, period]);
  // 1R = 1% convention
  const pct = stats.totalR;

  useEffect(() => {
    if (!open) return;
    localStorage.setItem(NICK_KEY, nick);
    const c = draw({ nick, pct, label: period === "Weekly" ? tx.week : tx.month, range: period === "Weekly" ? tx.wk : tx.mo, trades: stats.total, wr: stats.winRate, tx });
    setUrl(c.toDataURL("image/png"));
  }, [open, nick, pct, period, stats.total, stats.winRate, tx]);

  const fileName = `tokarsoft19-pnl-${period.toLowerCase()}.png`;

  const save = async () => {
    if (!url) return;
    try {
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], fileName, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
        return;
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    }
    const a = document.createElement("a");
    a.href = url; a.download = fileName; a.click();
    toast.success(tx.save);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Share2 className="mr-2 h-4 w-4" />{tx.btn}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-md">
        <DialogHeader><DialogTitle>{tx.title}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          {(["Weekly", "Monthly"] as Period[]).map((p) => (
            <Button key={p} variant={period === p ? "default" : "outline"} size="sm" onClick={() => setPeriod(p)} className={cn("w-full")}>
              {p === "Weekly" ? tx.week : tx.month}
            </Button>
          ))}
        </div>
        <div className="space-y-1">
          <Label htmlFor="pnl-nick">{tx.nick}</Label>
          <Input id="pnl-nick" value={nick} maxLength={14} onChange={(e) => setNick(e.target.value)} />
        </div>
        {url && <img src={url} alt="PnL" className="w-full rounded-lg border border-border" />}
        <Button onClick={save} className="w-full"><Download className="mr-2 h-4 w-4" />{tx.save}</Button>
      </DialogContent>
    </Dialog>
  );
}
