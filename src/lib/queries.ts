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

export type AccountStatus = "pending" | "approved" | "rejected";

export type Profile = {
  id: string;
  email: string;
  status: AccountStatus;
  created_at: string;
};

export function useProfile(enabled: boolean) {
  return useQuery({
    queryKey: ["profile"],
    enabled,
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return null;

      const [{ data: profile, error }, { data: roles, error: roleError }] = await Promise.all([
        supabase.from("profiles").select("id,email,status,created_at").eq("id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      if (error) throw error;
      if (roleError) throw roleError;

      return {
        profile: (profile ?? null) as Profile | null,
        isAdmin: (roles ?? []).some((r) => r.role === "admin"),
      };
    },
  });
}

export function useAllProfiles(enabled: boolean) {
  return useQuery({
    queryKey: ["all_profiles"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,email,status,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });
}

export function useSetUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AccountStatus }) => {
      const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all_profiles"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
