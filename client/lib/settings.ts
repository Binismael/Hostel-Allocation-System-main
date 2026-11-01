import { supabase } from "./supabase";

export const SETTING_KEYS = [
  "academic_session",
  "allocation_deadline",
  "bank_name",
  "bank_account_number",
  "bank_account_name",
  "payment_instructions",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];
export type Settings = Record<SettingKey, string>;

export const emptySettings = (): Settings =>
  Object.fromEntries(SETTING_KEYS.map((k) => [k, ""])) as Settings;

export async function getSettings() {
  const { data, error } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", SETTING_KEYS as unknown as string[]);
  const settings = emptySettings();
  for (const row of data ?? []) settings[row.key as SettingKey] = row.value ?? "";
  return { data: settings, error };
}

export async function saveSettings(settings: Settings) {
  const now = new Date().toISOString();
  const rows = SETTING_KEYS.map((key) => ({ key, value: settings[key].trim(), updated_at: now }));
  const { error } = await supabase.from("settings").upsert(rows, { onConflict: "key" });
  return { error };
}

export interface FeeTierRow {
  id: string;
  code: string;
  name: string;
  amount: number;
  eligible_room_categories: string[];
  is_active: boolean;
}

export async function getAllFeeTiers() {
  const { data, error } = await supabase
    .from("hostel_fee_tiers")
    .select("id, code, name, amount, eligible_room_categories, is_active")
    .order("amount");
  return { data: (data ?? []) as FeeTierRow[], error };
}

export async function updateFeeTier(id: string, updates: Pick<FeeTierRow, "name" | "amount" | "is_active">) {
  const { error } = await supabase
    .from("hostel_fee_tiers")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);
  return { error };
}
