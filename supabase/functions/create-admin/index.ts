import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const PERMISSIONS = ["students", "rooms", "allocations", "payments", "room_requests", "settings", "admins"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "Your session has expired. Please log in again." }, 401);

  const { data: caller } = await admin
    .from("admins")
    .select("role, permissions, is_active")
    .eq("id", userData.user.id)
    .maybeSingle();
  const canManage = caller?.is_active && (caller.role === "super_admin" || caller.permissions?.includes("admins"));
  if (!canManage) return json({ error: "You do not have permission to add admins." }, 403);

  const { email, name, password, role, permissions } = await req.json().catch(() => ({}));
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanRole = role === "super_admin" ? "super_admin" : "admin";
  const cleanPermissions: string[] = Array.isArray(permissions)
    ? permissions.filter((p: unknown): p is string => typeof p === "string" && PERMISSIONS.includes(p))
    : [];

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || !cleanName) {
    return json({ error: "Enter a valid name and email." }, 400);
  }
  if (typeof password !== "string" || password.length < 8) {
    return json({ error: "Temporary password must be at least 8 characters." }, 400);
  }
  if (cleanRole === "super_admin" && caller.role !== "super_admin") {
    return json({ error: "Only a super admin can add another super admin." }, 403);
  }
  if (cleanRole === "admin" && cleanPermissions.length === 0) {
    return json({ error: "Choose at least one area this admin can manage." }, 400);
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: cleanEmail,
    password,
    email_confirm: true,
    user_metadata: { role: "admin", full_name: cleanName },
  });
  if (createError || !created.user) {
    const exists = createError?.message?.toLowerCase().includes("already");
    return json(
      { error: exists ? "An account with this email already exists." : "Could not create the admin account." },
      exists ? 409 : 500,
    );
  }

  const { error: insertError } = await admin.from("admins").insert({
    id: created.user.id,
    email: cleanEmail,
    name: cleanName,
    role: cleanRole,
    permissions: cleanRole === "super_admin" ? [] : cleanPermissions,
    is_active: true,
  });
  if (insertError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ error: "Could not save the admin record." }, 500);
  }

  return json({ id: created.user.id }, 201);
});
