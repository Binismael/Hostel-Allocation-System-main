import { supabase } from "./supabase";

// Authentication
export async function signupStudentAccount(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: "student",
      },
    },
  });
  return { data, error };
}

// Students
export async function getStudents() {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function getStudent(id: string) {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .single();
  return { data, error };
}

export async function getStudentByEmail(email: string) {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("email", email)
    .single();
  return { data, error };
}

export async function createStudent(student: any) {
  const { data, error } = await supabase
    .from("students")
    .insert([student])
    .select()
    .single();
  return { data, error };
}

export async function updateStudent(id: string, updates: any) {
  const { data, error } = await supabase
    .from("students")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}

export async function deleteStudent(id: string) {
  const { error } = await supabase.from("students").delete().eq("id", id);
  return { error };
}

// Rooms
export async function getRooms() {
  const { data, error } = await supabase
    .from("rooms")
    .select("*, blocks(name)")
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function getRoom(id: string) {
  const { data, error } = await supabase
    .from("rooms")
    .select("*, blocks(name)")
    .eq("id", id)
    .single();
  return { data, error };
}

export async function createRoom(room: any) {
  const { data, error } = await supabase
    .from("rooms")
    .insert([room])
    .select()
    .single();
  return { data, error };
}

export async function updateRoom(id: string, updates: any) {
  const { data, error } = await supabase
    .from("rooms")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}

export async function deleteRoom(id: string) {
  const { error } = await supabase.from("rooms").delete().eq("id", id);
  return { error };
}

// Allocations
export async function getAllocations() {
  const { data, error } = await supabase
    .from("allocations")
    .select(
      `
      *,
      students (id, name, email, student_id),
      rooms (id, room_number, block_id, blocks (name))
    `,
    )
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function getAllocation(id: string) {
  const { data, error } = await supabase
    .from("allocations")
    .select(
      `
      *,
      students (id, name, email, student_id),
      rooms (id, room_number, block_id, blocks (name))
    `,
    )
    .eq("id", id)
    .single();
  return { data, error };
}

export async function createAllocation(allocation: any) {
  const { data, error } = await supabase
    .from("allocations")
    .insert([allocation])
    .select(
      `
      *,
      students (id, name, email),
      rooms (id, room_number, block_id)
    `,
    )
    .single();
  return { data, error };
}

export async function updateAllocation(id: string, updates: any) {
  const { data, error } = await supabase
    .from("allocations")
    .update(updates)
    .eq("id", id)
    .select(
      `
      *,
      students (id, name, email),
      rooms (id, room_number, block_id)
    `,
    )
    .single();
  return { data, error };
}

export async function deleteAllocation(id: string) {
  const { error } = await supabase.from("allocations").delete().eq("id", id);
  return { error };
}

// Blocks (Hostels)
export async function getBlocks() {
  const { data, error } = await supabase
    .from("blocks")
    .select("*")
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function getBlock(id: string) {
  const { data, error } = await supabase
    .from("blocks")
    .select("*")
    .eq("id", id)
    .single();
  return { data, error };
}

export async function createBlock(block: any) {
  const { data, error } = await supabase
    .from("blocks")
    .insert([block])
    .select()
    .single();
  return { data, error };
}

export async function updateBlock(id: string, updates: any) {
  const { data, error } = await supabase
    .from("blocks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}

export async function deleteBlock(id: string) {
  const { error } = await supabase.from("blocks").delete().eq("id", id);
  return { error };
}

// Admins
export async function getAdmins() {
  const { data, error } = await supabase
    .from("admins")
    .select("*")
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function getAdminByEmail(email: string) {
  const { data, error } = await supabase
    .from("admins")
    .select("*")
    .eq("email", email)
    .single();
  return { data, error };
}

export async function createAdmin(admin: any) {
  const { data, error } = await supabase
    .from("admins")
    .insert([admin])
    .select()
    .single();
  return { data, error };
}

export async function updateAdmin(id: string, updates: any) {
  const { data, error } = await supabase
    .from("admins")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}

export async function deleteAdmin(id: string) {
  const { error } = await supabase.from("admins").delete().eq("id", id);
  return { error };
}

// Notifications
export async function createNotification(notification: any) {
  const { data, error } = await supabase
    .from("notifications")
    .insert([notification])
    .select()
    .single();
  return { data, error };
}
