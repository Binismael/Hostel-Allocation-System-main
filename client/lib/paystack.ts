import { supabase } from "./supabase";

export type PaymentMethod = "paystack" | "bank_transfer";

const SCRIPT_URL = "https://js.paystack.co/v2/inline.js";

interface PaystackPopInstance {
  resumeTransaction(
    accessCode: string,
    callbacks: {
      onSuccess: (tx: { reference: string }) => void;
      onCancel: () => void;
      onError?: (error: { message: string }) => void;
    },
  ): void;
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

async function callPaystackFunction<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("paystack", { body });
  if (error) {
    const details = await (error as { context?: Response }).context?.json?.().catch(() => null);
    throw new Error(details?.error ?? "Could not reach the payment service.");
  }
  return data as T;
}

export async function openPaystackCheckout(params: { tierCode: string; roomId: string | null }) {
  const [{ access_code }] = await Promise.all([
    callPaystackFunction<{ access_code: string; reference: string }>({
      action: "initialize",
      fee_tier_code: params.tierCode,
      room_id: params.roomId,
    }),
    loadScript(),
  ]);

  return new Promise<string | null>((resolve, reject) => {
    new window.PaystackPop!().resumeTransaction(access_code, {
      onSuccess: (tx) => resolve(tx.reference),
      onCancel: () => resolve(null),
      onError: (error) => reject(new Error(error.message)),
    });
  });
}

export function confirmPaystackPayment(reference: string) {
  return callPaystackFunction<{
    payment_reference: string;
    outcome: string;
    block_name: string | null;
    room_number: string | null;
    bunk_number: string | null;
  }>({ action: "verify", reference });
}
