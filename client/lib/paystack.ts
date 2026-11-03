import { supabase } from "./supabase";

export type PaymentMethod = "paystack" | "bank_transfer";

export const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ?? "";
const SCRIPT_URL = "https://js.paystack.co/v2/inline.js";

interface PaystackTransaction {
  reference: string;
}

interface PaystackPopInstance {
  newTransaction(options: {
    key: string;
    email: string;
    amount: number;
    currency: string;
    reference: string;
    metadata: Record<string, unknown>;
    onSuccess: (tx: PaystackTransaction) => void;
    onCancel: () => void;
    onError?: (error: { message: string }) => void;
  }): void;
}

declare global {
  interface Window {
    PaystackPop?: new () => PaystackPopInstance;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadScript() {
  if (window.PaystackPop) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Could not load Paystack. Check your internet connection."));
    };
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export async function openPaystackCheckout(params: {
  email: string;
  amount: number;
  studentId: string;
  tierCode: string;
  roomId: string | null;
}) {
  await loadScript();
  const reference = `HOSTEL-${params.studentId.slice(0, 8)}-${Date.now()}`;
  return new Promise<string | null>((resolve, reject) => {
    new window.PaystackPop!().newTransaction({
      key: PAYSTACK_PUBLIC_KEY,
      email: params.email,
      amount: Math.round(params.amount * 100),
      currency: "NGN",
      reference,
      metadata: {
        student_id: params.studentId,
        fee_tier_code: params.tierCode,
        room_id: params.roomId,
      },
      onSuccess: (tx) => resolve(tx.reference),
      onCancel: () => resolve(null),
      onError: (error) => reject(new Error(error.message)),
    });
  });
}

export async function confirmPaystackPayment(reference: string) {
  const { data: sessionData } = await supabase.auth.getSession();
  const response = await fetch("/api/paystack/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionData.session?.access_token ?? ""}`,
    },
    body: JSON.stringify({ reference }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error ?? "Could not confirm your payment.");
  }
  return body as {
    payment_reference: string;
    outcome: string;
    block_name: string | null;
    room_number: string | null;
    bunk_number: string | null;
  };
}

export async function hasOpenPayment(studentId: string) {
  const { count } = await supabase
    .from("hostel_payments")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .in("status", ["submitted", "under_review", "verified"]);
  return (count ?? 0) > 0;
}
