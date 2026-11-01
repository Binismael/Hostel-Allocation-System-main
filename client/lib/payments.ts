import { supabase } from "./supabase";

export type PaymentType = "room_fee" | "room_exemption";

export const ROOM_EXEMPTION_FEE = 20000;

export const HOSTEL_ACCOUNT = {
  accountNumber: import.meta.env.VITE_HOSTEL_ACCOUNT_NUMBER ?? "",
  accountName: import.meta.env.VITE_HOSTEL_ACCOUNT_NAME ?? "",
  bankName: import.meta.env.VITE_HOSTEL_BANK_NAME ?? "",
};

export interface TransferDetails {
  amount: string;
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
  amount: "",
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

export function validateTransfer(
  type: PaymentType,
  roomId: string,
  details: TransferDetails,
): string | null {
  if (type === "room_fee" && !roomId) {
    return "Choose a room from the Hostel Directory before paying the room fee";
  }
  const amount = Number(details.amount);
  if (type === "room_fee" && (!Number.isFinite(amount) || amount <= 0)) {
    return "Enter the amount you transferred";
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

export async function submitPayment(params: {
  studentId: string;
  email: string;
  roomId: string;
  type: PaymentType;
  details: TransferDetails;
}) {
  const { studentId, email, roomId, type, details } = params;
  return supabase.from("payments").insert([
    {
      student_id: studentId,
      room_id: type === "room_fee" ? roomId : null,
      payment_type: type,
      amount:
        type === "room_exemption" ? ROOM_EXEMPTION_FEE : Number(details.amount),
      payer_name: details.payerName.trim(),
      payer_bank: details.payerBank.trim(),
      recipient_account_number: details.recipientAccountNumber.trim(),
      recipient_account_name: details.recipientAccountName.trim(),
      session_id: details.sessionId.trim(),
      reference_id: details.referenceId.trim(),
      transfer_date: details.transferDate,
      remarks: details.remarks.trim() || null,
      authorized_email: email,
      status: "pending",
    },
  ]);
}
