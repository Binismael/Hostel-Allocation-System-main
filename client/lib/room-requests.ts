import { supabase } from "./supabase";

export interface RoomRequestRow {
  id: string;
  student_id: string;
  submitted_at: string;
  semester: string | null;
  status: string;
  phone: string | null;
  comments: string | null;
  allocation_reason: string | null;
  room_category_preference: string | null;
  room_type_preference: string | null;
  room_capacity_preference: string | null;
  students: { name: string; student_id: string; email: string } | null;
  p1: { name: string } | null;
  p2: { name: string } | null;
  p3: { name: string } | null;
}

export async function listRoomRequests() {
  const [requests, payments] = await Promise.all([
    supabase
      .from("room_requests")
      .select(
        `*, students(name, student_id, email),
         p1:blocks!room_requests_preference_1_block_id_fkey(name),
         p2:blocks!room_requests_preference_2_block_id_fkey(name),
         p3:blocks!room_requests_preference_3_block_id_fkey(name)`,
      )
      .order("submitted_at", { ascending: false }),
    supabase
      .from("hostel_payments")
      .select("student_id, status, submitted_at")
      .order("submitted_at", { ascending: false }),
  ]);

  const latestPayment = new Map<string, string>();
  for (const p of payments.data ?? []) {
    if (!latestPayment.has(p.student_id)) latestPayment.set(p.student_id, p.status);
  }

  return {
    data: (requests.data ?? []) as RoomRequestRow[],
    paymentStatus: latestPayment,
    error: requests.error ?? payments.error,
  };
}

export async function setRoomRequestStatus(
  request: RoomRequestRow,
  status: "reviewed" | "rejected",
  message: string,
) {
  const { error } = await supabase
    .from("room_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", request.id);
  if (error || !message.trim()) return { error };

  const { error: notifyError } = await supabase.from("notifications").insert({
    type: "room_request",
    title: status === "rejected" ? "Room request not approved" : "Room request reviewed",
    message: message.trim(),
    student_id: request.student_id,
  });
  return { error: notifyError };
}
