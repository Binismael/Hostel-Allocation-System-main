import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { useAuth } from "@/context/AuthContext";

export const PERMISSIONS = [
  { key: "students", label: "Students", description: "Add, edit and remove students" },
  { key: "rooms", label: "Rooms & blocks", description: "Manage hostel blocks, rooms and bunks" },
  { key: "allocations", label: "Allocations", description: "Assign, move and release bunks" },
  { key: "payments", label: "Payments", description: "Verify or reject student payments" },
  { key: "room_requests", label: "Room requests", description: "Review student room requests" },
  { key: "settings", label: "Settings & fees", description: "Session, bank account and fee amounts" },
  { key: "admins", label: "Admins", description: "Add admins and change their access" },
] as const;

export type Permission = (typeof PERMISSIONS)[number]["key"];
export type AdminRole = "super_admin" | "admin";

export interface AdminProfile {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions: Permission[];
  is_active: boolean;
  last_login?: string | null;
  created_at?: string;
}

export const canAccess = (admin: AdminProfile | null | undefined, permission?: Permission) =>
  !!admin?.is_active && (!permission || admin.role === "super_admin" || admin.permissions.includes(permission));

export function useAdminProfile() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["admin-profile", user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("admins")
        .select("id, email, name, role, permissions, is_active")
        .eq("id", user!.id)
        .eq("is_active", true)
        .maybeSingle();
      return (data as AdminProfile | null) ?? null;
    },
  });
  return { admin: query.data ?? null, loading: !!user?.id && query.isLoading };
}

export async function listAdmins() {
  const { data, error } = await supabase
    .from("admins")
    .select("id, email, name, role, permissions, is_active, last_login, created_at")
    .order("created_at");
  return { data: (data ?? []) as AdminProfile[], error };
}

export async function createAdmin(input: {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  permissions: Permission[];
}) {
  const { error } = await supabase.functions.invoke("create-admin", { body: input });
  if (!error) return { error: null };
  const details = await (error as { context?: Response }).context?.json?.().catch(() => null);
  return { error: (details?.error as string) ?? "Could not add admin." };
}

export async function updateAdminAccess(
  id: string,
  changes: { name: string; role: AdminRole; permissions: Permission[]; is_active: boolean },
) {
  const { error } = await supabase.rpc("update_admin_access", {
    p_admin_id: id,
    p_name: changes.name,
    p_role: changes.role,
    p_permissions: changes.permissions,
    p_is_active: changes.is_active,
  });
  return { error: error?.message ?? null };
}
