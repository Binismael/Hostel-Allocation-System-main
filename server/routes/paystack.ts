import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data?: {
    status: string;
    reference: string;
    amount: number;
    currency: string;
    channel: string;
    paid_at: string | null;
    customer: { email: string };
    metadata: { student_id?: string; fee_tier_code?: string; room_id?: string | null } | null;
  };
}

export const handlePaystackVerify: RequestHandler = async (req, res) => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  if (!supabaseUrl || !serviceKey || !paystackSecret) {
    res.status(500).json({ error: "Online payment is not configured. Please contact the hostel office." });
    return;
  }

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  const reference = typeof req.body?.reference === "string" ? req.body.reference.trim() : "";
  if (!token || !/^[A-Za-z0-9._=-]{6,100}$/.test(reference)) {
    res.status(400).json({ error: "A signed-in student and a valid payment reference are required." });
    return;
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) {
    res.status(401).json({ error: "Your session has expired. Please log in again." });
    return;
  }

  let verification: PaystackVerifyResponse;
  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${paystackSecret}` } },
    );
    verification = (await response.json()) as PaystackVerifyResponse;
  } catch {
    res.status(502).json({ error: "Could not reach Paystack. Your payment will be confirmed shortly — do not pay again." });
    return;
  }

  const tx = verification.data;
  if (!verification.status || !tx || tx.status !== "success") {
    res.status(402).json({ error: "Paystack has not confirmed this payment." });
    return;
  }
  if (tx.currency !== "NGN" || tx.metadata?.student_id !== userData.user.id || !tx.metadata?.fee_tier_code) {
    res.status(400).json({ error: "This payment does not belong to your account." });
    return;
  }

  const { data, error } = await admin.rpc("record_paystack_payment", {
    p_student_id: userData.user.id,
    p_fee_tier_code: tx.metadata.fee_tier_code,
    p_room_id: tx.metadata.room_id || null,
    p_reference: tx.reference,
    p_amount: tx.amount / 100,
    p_paid_at: (tx.paid_at ?? new Date().toISOString()).slice(0, 10),
    p_payer_email: tx.customer.email,
    p_channel: tx.channel,
  });

  if (error) {
    res.status(409).json({
      error: `Your payment was received but could not be recorded (${error.message}). Contact the hostel office with reference ${tx.reference}.`,
    });
    return;
  }

  res.json(Array.isArray(data) ? data[0] : data);
};
