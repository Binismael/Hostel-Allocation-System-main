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

const PAYSTACK_API = "https://api.paystack.co";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY");
  if (!paystackSecret) {
    return json({ error: "Online payment is not configured. Please contact the hostel office." }, 500);
  }

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "Your session has expired. Please log in again." }, 401);
  const user = userData.user;

  const body = await req.json().catch(() => ({}));

  if (body.action === "initialize") {
    const tierCode = typeof body.fee_tier_code === "string" ? body.fee_tier_code : "";
    const roomId = typeof body.room_id === "string" && body.room_id ? body.room_id : null;

    const { data: student } = await admin.from("students").select("id, email").eq("id", user.id).maybeSingle();
    if (!student) return json({ error: "Only students can pay hostel fees." }, 403);

    const { data: tier } = await admin
      .from("hostel_fee_tiers")
      .select("code, amount, eligible_room_categories")
      .eq("code", tierCode)
      .eq("is_active", true)
      .maybeSingle();
    if (!tier) return json({ error: "The selected hostel fee is unavailable." }, 400);

    if (tier.eligible_room_categories.length > 0) {
      const { data: room } = roomId
        ? await admin.from("rooms").select("room_category").eq("id", roomId).maybeSingle()
        : { data: null };
      if (!room || !tier.eligible_room_categories.includes(room.room_category)) {
        return json({ error: "Choose a room that matches this hostel fee." }, 400);
      }
    } else if (roomId) {
      return json({ error: "A room exemption payment cannot include a room." }, 400);
    }

    const { count } = await admin
      .from("hostel_payments")
      .select("id", { count: "exact", head: true })
      .eq("student_id", user.id)
      .in("status", ["submitted", "under_review", "verified"]);
    if ((count ?? 0) > 0) {
      return json({ error: "You already have a payment awaiting review or verified. Check My Payments." }, 409);
    }

    const reference = `HOSTEL-${user.id.slice(0, 8)}-${Date.now()}`;
    const response = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
      method: "POST",
      headers: { Authorization: `Bearer ${paystackSecret}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email ?? student.email,
        amount: Math.round(Number(tier.amount) * 100),
        currency: "NGN",
        reference,
        metadata: { student_id: user.id, fee_tier_code: tier.code, room_id: roomId },
      }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.status) {
      return json({ error: result?.message ?? "Paystack could not start this payment." }, 502);
    }
    return json({ access_code: result.data.access_code, reference: result.data.reference });
  }

  if (body.action === "verify") {
    const reference = typeof body.reference === "string" ? body.reference.trim() : "";
    if (!/^[A-Za-z0-9._=-]{6,100}$/.test(reference)) return json({ error: "Invalid payment reference." }, 400);

    const response = await fetch(`${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${paystackSecret}` },
    });
    const result = await response.json().catch(() => null);
    const tx = result?.data;
    if (!result?.status || !tx || tx.status !== "success") {
      return json({ error: "Paystack has not confirmed this payment yet." }, 402);
    }
    if (tx.currency !== "NGN" || tx.metadata?.student_id !== user.id || !tx.metadata?.fee_tier_code) {
      return json({ error: "This payment does not belong to your account." }, 400);
    }

    const { data, error } = await admin.rpc("record_paystack_payment", {
      p_student_id: user.id,
      p_fee_tier_code: tx.metadata.fee_tier_code,
      p_room_id: tx.metadata.room_id || null,
      p_reference: tx.reference,
      p_amount: tx.amount / 100,
      p_paid_at: String(tx.paid_at ?? new Date().toISOString()).slice(0, 10),
      p_payer_email: tx.customer?.email ?? user.email,
      p_channel: tx.channel ?? "",
    });
    if (error) {
      return json(
        {
          error: `Your payment was received but could not be recorded (${error.message}). Contact the hostel office with reference ${tx.reference}.`,
        },
        409,
      );
    }
    return json(Array.isArray(data) ? data[0] : data);
  }

  return json({ error: "Unknown action" }, 400);
});
