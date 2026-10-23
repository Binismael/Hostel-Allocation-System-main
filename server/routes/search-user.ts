import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

export const handleSearchUser: RequestHandler = async (req, res) => {
  const { email } = req.query;

  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    res.status(500).json({ error: "Supabase configuration missing" });
    return;
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      res.status(500).json({ error: "Failed to search users" });
      return;
    }

    const user = data.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name,
      phone: user.user_metadata?.phone,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to search users" });
  }
};
