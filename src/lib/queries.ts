import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { RiskRule, Setup, Trade } from "./trading";

export function useTrades(enabled: boolean) {
  return useQuery({
    queryKey: ["trades"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .order("traded_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Trade[];
    },
  });
}

export function useSetups(enabled: boolean) {
  return useQuery({
    queryKey: ["setups"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("setups")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Setup[];
    },
  });
}

export function useRiskRules(enabled: boolean) {
  return useQuery({
    queryKey: ["risk_rules"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risk_rules")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as RiskRule[];
    },
  });
}

type Row = Record<string, unknown>;

export function useUpsertRow(table: "trades" | "setups" | "risk_rules", key: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Row & { id?: string }) => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Not signed in");

      if (values.id) {
        const { id, ...rest } = values;
        const { error } = await supabase
          .from(table)
          .update(rest as never)
          .eq("id", id as string);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(table)
          .insert({ ...values, user_id: userId } as never);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
  });
}

export function useDeleteRow(table: "trades" | "setups" | "risk_rules", key: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
  });
}
