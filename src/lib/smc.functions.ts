import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callGateway, type GatewayMessage } from "@/lib/ai-gateway.server";
import {
  buildSystemPrompt,
  buildUserPrompt,
  enforceAssetFilter,
  parseAnalysis,
  parseTradingViewUrl,
  type SmcAnalysis,
} from "@/lib/smc-engine";

export type SmcRequest = {
  prompt: string;
  chartUrl?: string | null;
  image?: string | null;
  lang: string;
};

export const analyzeSmcChart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: SmcRequest) => ({
    prompt: String(input.prompt ?? "").slice(0, 4000),
    chartUrl: input.chartUrl ? String(input.chartUrl).slice(0, 1000) : null,
    image: input.image && input.image.startsWith("data:image/") ? input.image : null,
    lang: ["UA", "RU", "EN"].includes(String(input.lang)) ? String(input.lang) : "EN",
  }))
  .handler(async ({ data }): Promise<SmcAnalysis> => {
    const apiKey = process.env['LOVABLE_API_KEY'];
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const { symbol, interval } = parseTradingViewUrl(data.chartUrl ?? "");
    const userText = buildUserPrompt({
      prompt: data.prompt,
      chartUrl: data.chartUrl,
      symbol,
      interval,
    });

    const content: Array<
      { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }
    > = [{ type: "text", text: userText }];
    if (data.image) content.push({ type: "image_url", image_url: { url: data.image } });

    const messages: GatewayMessage[] = [
      { role: "system", content: buildSystemPrompt(data.lang) },
      { role: "user", content },
    ];

    const raw = await callGateway(apiKey, "google/gemini-3.7-flash", messages);
    const analysis = parseAnalysis(raw);
    return enforceAssetFilter(analysis, [analysis.asset, symbol ?? "", data.prompt, data.chartUrl ?? ""]);
  });
