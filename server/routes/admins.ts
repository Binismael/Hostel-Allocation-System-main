import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

const PERMISSIONS = ["students", "rooms", "allocations", "payments", "room_requests", "settings", "admins"];

export const handleCreateAdmin: RequestHandler = async (req, res) => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    res.status(500).json({ error: "Admin management is not configured (missing SUPABASE_SERVICE_ROLE_KEY)." });
    return;
  }

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) {
    res.status(401).json({ error: "Please log in again." });
    return;
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) {
    res.status(401).json({ error: "Your session has expired. Please log in again." });
    return;
  }

  const { data: caller } = await admin
    .from("admins")
    .select("role, permissions, is_active")
    .eq("id", userData.user.id)
    .maybeSingle();
  const canManage =
    caller?.is_active && (caller.role === "super_admin" || caller.permissions?.includes("admins"));
  if (!canManage) {
    res.status(403).json({ error: "You do not have permission to add admins." });
    return;
  }

  const { email, name, password, role, permissions } = req.body ?? {};
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanRole = role === "super_admin" ? "super_admin" : "admin";
  const cleanPermissions = Array.isArray(permissions)
    ? permissions.filter((p): p is string => typeof p === "string" && PERMISSIONS.includes(p))
    : [];

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || !cleanName) {
    res.status(400).json({ error: "Enter a valid name and email." });
    return;
  }
  if (typeof password !== "string" || password.length < 8) {
    res.status(400).json({ error: "Temporary password must be at least 8 characters." });
    return;
  }
  if (cleanRole === "super_admin" && caller.role !== "super_admin") {
    res.status(403).json({ error: "Only a super admin can add another super admin." });
    return;
  }
  if (cleanRole === "admin" && cleanPermissions.length === 0) {
    res.status(400).json({ error: "Choose at least one area this admin can manage." });
    return;
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: cleanEmail,
    password,
    email_confirm: true,
    user_metadata: { role: "admin", full_name: cleanName },
  });
  if (createError || !created.user) {
    const exists = createError?.message?.toLowerCase().includes("already");
    res.status(exists ? 409 : 500).json({
      error: exists ? "An account with this email already exists." : "Could not create the admin account.",
    });
    return;
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
    res.status(500).json({ error: "Could not save the admin record." });
    return;
  }

  res.status(201).json({ id: created.user.id });
};
