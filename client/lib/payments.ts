import { supabase } from "./supabase";

export type PaymentType = "room_fee" | "room_exemption";

export const EXEMPTION_TIER_CODE = "room_exemption";
export const RECEIPT_BUCKET = "payment-receipts";
export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
export const RECEIPT_TYPES = ["image/jpeg", "image/png", "application/pdf"];

export interface FeeTier {
  id: string;
  code: string;
  name: string;
  amount: number;
  eligible_room_categories: string[];
}

export const HOSTEL_ACCOUNT = {
  accountNumber: import.meta.env.VITE_HOSTEL_ACCOUNT_NUMBER ?? "",
  accountName: import.meta.env.VITE_HOSTEL_ACCOUNT_NAME ?? "",
  bankName: import.meta.env.VITE_HOSTEL_BANK_NAME ?? "",
};

export interface TransferDetails {
  payerName: string;
  payerBank: string;
  recipientAccountNumber: string;
  recipientAccountName: string;
  sessionId: string;
  referenceId: string;
  transferDate: string;
  remarks: string;
}

export const emptyTransferDetails = (): TransferDetails => ({
  payerName: "",
  payerBank: "",
  recipientAccountNumber: HOSTEL_ACCOUNT.accountNumber,
  recipientAccountName: HOSTEL_ACCOUNT.accountName,
  sessionId: "",
  referenceId: "",
  transferDate: new Date().toISOString().split("T")[0],
  remarks: "",
});

export const formatNaira = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);

export async function getFeeTiers() {
  const { data, error } = await supabase
    .from("hostel_fee_tiers")
    .select("id, code, name, amount, eligible_room_categories")
    .eq("is_active", true);
  return { data: (data ?? []) as FeeTier[], error };
}

export function findTier(
  tiers: FeeTier[],
  type: PaymentType,
  roomCategory?: string | null,
) {
  if (type === "room_exemption") {
    return tiers.find((t) => t.code === EXEMPTION_TIER_CODE);
  }
  const category = roomCategory || "standard";
  return tiers.find((t) => t.eligible_room_categories.includes(category));
}

export function validateTransfer(
  type: PaymentType,
  roomId: string,
  details: TransferDetails,
  receipt: File | null,
): string | null {
  if (type === "room_fee" && !roomId) {
    return "Choose a room from the Hostel Directory before paying the room fee";
  }
  if (!details.payerName.trim() || !details.payerBank.trim()) {
    return "Enter the sender's name and bank";
  }
  if (!/^\d{10}$/.test(details.recipientAccountNumber.trim())) {
    return "Recipient account number must be 10 digits";
  }
  if (!details.recipientAccountName.trim()) {
    return "Enter the recipient account name";
  }
  if (!details.sessionId.trim() || !details.referenceId.trim()) {
    return "Enter both the session ID and reference ID from your transfer receipt";
  }
  if (!details.transferDate) {
    return "Enter the transfer date";
  }
  if (!receipt) {
    return "Upload your transfer receipt";
  }
  if (!RECEIPT_TYPES.includes(receipt.type)) {
    return "Receipt must be a JPG, PNG, or PDF file";
  }
  if (receipt.size > MAX_RECEIPT_BYTES) {
    return "Receipt must be 5 MB or smaller";
  }
  return null;
}

export async function sendAuthorizationCode(email: string) {
  return supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
}

export async function verifyAuthorizationCode(email: string, token: string) {
  return supabase.auth.verifyOtp({ email, token, type: "email" });
}

export async function submitBankTransfer(params: {
  studentId: string;
  tierCode: string;
  roomId: string | null;
  details: TransferDetails;
  receipt: File;
}) {
  const { studentId, tierCode, roomId, details, receipt } = params;
  const paymentId = crypto.randomUUID();
  const extension = receipt.name.split(".").pop()?.toLowerCase() || "file";
  const receiptPath = `student/${studentId}/${paymentId}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(RECEIPT_BUCKET)
    .upload(receiptPath, receipt, { contentType: receipt.type });
  if (uploadError) {
    return {
      data: null,
      error: {
        message: "Could not upload your receipt. Please try again.",
        expired: false,
      },
    };
  }

  const { data, error } = await supabase.rpc("submit_bank_transfer_payment", {
    p_payment_id: paymentId,
    p_fee_tier_code: tierCode,
    p_room_id: roomId,
    p_bank_reference: details.referenceId.trim(),
    p_session_id: details.sessionId.trim(),
    p_recipient_account_number: details.recipientAccountNumber.trim(),
    p_recipient_account_name: details.recipientAccountName.trim(),
    p_payer_name: details.payerName.trim(),
    p_payer_bank: details.payerBank.trim(),
    p_remarks: details.remarks.trim(),
    p_paid_at: details.transferDate,
    p_receipt_path: receiptPath,
  });

  if (error) return { data: null, error: describeSubmitError(error) };
  const row = Array.isArray(data) ? data[0] : data;
  return { data: row as { payment_reference: string }, error: null };
}

function describeSubmitError(error: { code?: string; message?: string }) {
  const message = error.message ?? "";
  if (message.includes("hostel_payments_open_bank_reference")) {
    return { message: "This reference ID has already been submitted.", expired: false };
  }
  if (message.includes("hostel_payments_one_open_submission")) {
    return {
      message: "You already have a payment awaiting review or verified.",
      expired: false,
    };
  }
  if (message.startsWith("Email authorization required")) {
    return {
      message: "Your email authorization has expired. Send a new code and try again.",
      expired: true,
    };
  }
  return { message: message || "Could not submit your payment.", expired: false };
}
