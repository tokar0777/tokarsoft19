import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ImageUp, Link2, Send, ShieldCheck, ShieldAlert, ShieldX, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { analyzeSmc, type SmcAnalysis } from "@/lib/smc-validator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/validator")({
  head: () => ({
    meta: [
      { title: "SMC Validator Bot — Quant Trading Hub" },
      {
        name: "description",
        content:
          "Validate a trade idea strictly with Smart Money Concepts: market structure, liquidity, POI and a final verdict.",
      },
      { property: "og:title", content: "SMC Validator Bot — Quant Trading Hub" },
      {
        property: "og:description",
        content: "Strict ICT validation of your trade idea: structure, liquidity, POI, verdict.",
      },
    ],
  }),
  component: ValidatorPage,
});

type Entry = {
  id: string;
  prompt: string;
  image: string | null;
  chartUrl: string | null;
  analysis: SmcAnalysis | null;
};

function ValidatorPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [prompt, setPrompt] = useState("");
  const [chartUrl, setChartUrl] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function readFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() && !chartUrl.trim() && !image) return;
    const id = crypto.randomUUID();
    const entry: Entry = {
      id,
      prompt: prompt.trim() || "Validate this chart against the SMC model.",
      image,
      chartUrl: chartUrl.trim() || null,
      analysis: null,
    };
    setEntries((prev) => [...prev, entry]);
    setPrompt("");
    setChartUrl("");
    setImage(null);
    setBusy(true);

    const seed = `${entry.prompt}|${entry.chartUrl ?? ""}|${entry.image ? entry.image.length : 0}`;
    await new Promise((r) => setTimeout(r, 900));
    const analysis = analyzeSmc(seed);
    setEntries((prev) => prev.map((x) => (x.id === id ? { ...x, analysis } : x)));
    setBusy(false);
  }

  return (
    <AppShell
      title="SMC Validator Bot"
      subtitle="Strict ICT evaluation — no indicators, no trendlines, no classical patterns"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-h-[60vh] flex-col rounded-lg border border-border bg-card">
          <div className="flex-1 space-y-6 overflow-y-auto p-5">
            {entries.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                <span className="mb-3 flex size-12 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <ShieldCheck className="size-6" />
                </span>
                <p className="text-sm font-medium">Drop a TradingView screenshot or paste a chart link</p>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  The bot grades your idea on market structure, liquidity and points of interest,
                  then returns a verdict. Analysis is simulated until a model key is attached.
                </p>
              </div>
            )}

            {entries.map((entry) => (
              <div key={entry.id} className="space-y-4">
                <div className="flex justify-end">
                  <div className="max-w-md rounded-lg bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                    <p>{entry.prompt}</p>
                    {entry.chartUrl && (
                      <p className="mt-1 break-all text-xs opacity-80">{entry.chartUrl}</p>
                    )}
                    {entry.image && (
                      <img
                        src={entry.image}
                        alt="Submitted chart screenshot"
                        className="mt-2 rounded border border-primary-foreground/20"
                      />
                    )}
                  </div>
                </div>

                {entry.analysis ? (
                  <AnalysisBlock analysis={entry.analysis} />
                ) : (
                  <p className="animate-pulse text-sm text-muted-foreground">
                    Reading structure, liquidity and PD arrays…
                  </p>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3 border-t border-border p-4">
            {image && (
              <div className="relative inline-block">
                <img src={image} alt="Chart preview" className="h-20 rounded border border-border" />
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  className="absolute -right-2 -top-2 rounded-full bg-background p-1 text-muted-foreground"
                >
                  <X className="size-3" />
                </button>
              </div>
            )}
            <Textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="EUR/USD long from the London FVG after the Asian low sweep — valid?"
            />
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={chartUrl}
                  onChange={(e) => setChartUrl(e.target.value)}
                  placeholder="TradingView chart URL"
                />
              </div>
              <Button type="submit" size="icon" disabled={busy}>
                <Send className="size-4" />
              </Button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) readFile(file);
            }}
            onClick={() => fileRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card p-8 text-center transition-colors",
              dragging && "border-primary bg-primary/5",
            )}
          >
            <ImageUp className="mb-2 size-6 text-muted-foreground" />
            <p className="text-sm font-medium">Drop chart screenshot</p>
            <p className="mt-1 text-xs text-muted-foreground">PNG or JPG from TradingView</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) readFile(file);
              }}
            />
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold tracking-wide">Model scope</h2>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li>Market structure: BOS, ChoCh, HTF delivery</li>
              <li>Liquidity: internal / external sweeps, SMT</li>
              <li>POI: FVG, order block, breaker, premium/discount</li>
              <li className="text-short">Ignored: indicators, trendlines, chart patterns</li>
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

const VERDICT_META = {
  CONFIRMED: { icon: ShieldCheck, className: "border-long/40 bg-long/10 text-long" },
  "HIGH RISK": {
    icon: ShieldAlert,
    className: "border-neutral-signal/40 bg-neutral-signal/10 text-neutral-signal",
  },
  INVALIDATED: { icon: ShieldX, className: "border-short/40 bg-short/10 text-short" },
} as const;

function AnalysisBlock({ analysis }: { analysis: SmcAnalysis }) {
  const meta = VERDICT_META[analysis.verdict];
  const Icon = meta.icon;
  return (
    <div className="space-y-4 text-sm">
      <Section index="01" title="Market structure check" items={analysis.structure} />
      <Section index="02" title="Liquidity analysis" items={analysis.liquidity} />
      <Section index="03" title="Price action & POI" items={analysis.priceAction} />
      <div className={cn("rounded-lg border p-4", meta.className)}>
        <div className="flex items-center gap-2">
          <Icon className="size-4" />
          <span className="tabular text-xs uppercase tracking-[0.2em]">Final verdict</span>
          <span className="ml-auto text-sm font-semibold">{analysis.verdict}</span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-foreground/80">{analysis.summary}</p>
      </div>
    </div>
  );
}

function Section({ index, title, items }: { index: string; title: string; items: string[] }) {
  return (
    <div>
      <p className="tabular text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {index} · {title}
      </p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-xs leading-relaxed">
            <span className="text-primary">›</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
