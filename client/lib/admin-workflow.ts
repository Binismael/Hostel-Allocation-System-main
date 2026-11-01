import { supabase } from "./supabase";
import { RECEIPT_BUCKET } from "./payments";

export type PaymentStatus = "submitted" | "under_review" | "verified" | "rejected";

export interface AdminPayment {
  id: string;
  payment_reference: string;
  student_id: string;
  allocation_id: string | null;
  amount: number;
  status: PaymentStatus;
  paid_at: string;
  submitted_at: string;
  bank_reference: string | null;
  session_id: string | null;
  recipient_account_number: string | null;
  recipient_account_name: string | null;
  payer_name: string | null;
  payer_bank: string | null;
  remarks: string | null;
  authorized_email: string | null;
  receipt_path: string;
  verification_notes: string | null;
  rejection_reason: string | null;
  verified_at: string | null;
  students: { name: string; student_id: string; email: string } | null;
  hostel_fee_tiers: { code: string; name: string } | null;
  rooms: { room_number: string; room_category: string | null; blocks: { name: string } | null } | null;
  allocations: { status: string; bunk_id: string | null } | null;
}

export interface PaymentEvent {
  id: string;
  action: string;
  notes: string | null;
  created_at: string;
}

export interface AvailableBunk {
  id: string;
  bunk_number: string;
  level: string;
  rooms: { id: string; room_number: string; room_category: string | null; blocks: { name: string } | null };
}

const PAYMENT_SELECT = `*,
  students(name, student_id, email),
  hostel_fee_tiers(code, name),
  rooms(room_number, room_category, blocks(name)),
  allocations(status, bunk_id)`;

export async function listPayments() {
  const { data, error } = await supabase
    .from("hostel_payments")
    .select(PAYMENT_SELECT)
    .order("submitted_at", { ascending: false });
  return { data: (data ?? []) as AdminPayment[], error };
}

export async function listPaymentEvents(paymentId: string) {
  const { data, error } = await supabase
    .from("payment_verification_events")
    .select("id, action, notes, created_at")
    .eq("payment_id", paymentId)
    .order("created_at", { ascending: true });
  return { data: (data ?? []) as PaymentEvent[], error };
}

export async function getReceiptUrl(path: string) {
  const { data, error } = await supabase.storage
    .from(RECEIPT_BUCKET)
    .createSignedUrl(path, 60 * 10);
  return { url: data?.signedUrl ?? null, error };
}

export async function reviewPayment(
  paymentId: string,
  decision: "verified" | "rejected",
  notes: string,
) {
  const { data, error } = await supabase.rpc("verify_and_auto_allocate_hostel_payment", {
    p_payment_id: paymentId,
    p_decision: decision,
    p_notes: notes.trim() || null,
  });
  const row = Array.isArray(data) ? data[0] : data;
  return {
    data: row as
      | { outcome: string; block_name: string | null; room_number: string | null; bunk_number: string | null }
      | undefined,
    error,
  };
}

export async function listAvailableBunks(categories?: string[]) {
  let query = supabase
    .from("bunks")
    .select("id, bunk_number, level, rooms!inner(id, room_number, room_category, blocks(name))")
    .eq("status", "available")
    .order("bunk_number");
  if (categories?.length) query = query.in("rooms.room_category", categories);
  const { data, error } = await query;
  const bunks = ((data ?? []) as unknown as AvailableBunk[]).sort((a, b) =>
    bunkLabel(a).localeCompare(bunkLabel(b), undefined, { numeric: true }),
  );
  return { data: bunks, error };
}

export const bunkLabel = (b: AvailableBunk) =>
  `${b.rooms.blocks?.name ?? "Block"} · Room ${b.rooms.room_number} · ${b.bunk_number} (${b.level})`;

export async function getVerifiedRoomPayment(allocationId: string) {
  const { data, error } = await supabase
    .from("hostel_payments")
    .select("id, room_id, hostel_fee_tiers(code, name, eligible_room_categories)")
    .eq("allocation_id", allocationId)
    .eq("status", "verified")
    .order("verified_at", { ascending: false });
  const payment = (data ?? []).find(
    (p: any) => p.hostel_fee_tiers?.eligible_room_categories?.length > 0,
  ) as unknown as
    | { id: string; room_id: string | null; hostel_fee_tiers: { code: string; name: string; eligible_room_categories: string[] } }
    | undefined;
  return { data: payment ?? null, error };
}

export const hasVerifiedRoomPayment = (allocation: {
  hostel_payments?: { status: string; hostel_fee_tiers: { eligible_room_categories: string[] } | null }[];
}) =>
  (allocation.hostel_payments ?? []).some(
    (p) => p.status === "verified" && (p.hostel_fee_tiers?.eligible_room_categories?.length ?? 0) > 0,
  );

export async function assignBunk(allocationId: string, bunkId: string, notes?: string) {
  const { data, error } = await supabase.rpc("assign_verified_payment_to_bunk", {
    p_allocation_id: allocationId,
    p_bunk_id: bunkId,
    p_notes: notes?.trim() || null,
  });
  const row = Array.isArray(data) ? data[0] : data;
  return { data: row as { block_name: string; room_number: string; bunk_number: string } | undefined, error };
}

export async function releaseAllocation(allocationId: string, reason: string) {
  const { error } = await supabase.rpc("release_allocation", {
    p_allocation_id: allocationId,
    p_reason: reason.trim(),
  });
  return { error };
}
