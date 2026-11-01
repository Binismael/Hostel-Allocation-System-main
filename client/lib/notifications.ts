import { supabase } from "./supabase";

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export async function listNotifications(studentId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, message, is_read, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  return { data: (data ?? []) as Notification[], error };
}

export async function countUnread(studentId: string) {
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .eq("is_read", false);
  return count ?? 0;
}

export async function markRead(studentId: string, ids?: string[]) {
  let query = supabase
    .from("notifications")
    .update({ is_read: true, updated_at: new Date().toISOString() })
    .eq("student_id", studentId)
    .eq("is_read", false);
  if (ids) query = query.in("id", ids);
  const { error } = await query;
  if (!error) window.dispatchEvent(new Event("notifications-changed"));
  return { error };
}
