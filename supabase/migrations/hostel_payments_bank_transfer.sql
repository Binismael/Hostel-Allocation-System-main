-- Bank-transfer details for the existing hostel payment workflow.
ALTER TABLE public.hostel_payments
  ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS session_id TEXT,
  ADD COLUMN IF NOT EXISTS recipient_account_number TEXT,
  ADD COLUMN IF NOT EXISTS recipient_account_name TEXT,
  ADD COLUMN IF NOT EXISTS payer_name TEXT,
  ADD COLUMN IF NOT EXISTS payer_bank TEXT,
  ADD COLUMN IF NOT EXISTS remarks TEXT,
  ADD COLUMN IF NOT EXISTS authorized_email TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS hostel_payments_open_bank_reference
  ON public.hostel_payments (lower(trim(bank_reference)))
  WHERE bank_reference IS NOT NULL
    AND status IN ('submitted', 'under_review', 'verified');

CREATE OR REPLACE FUNCTION public.submit_bank_transfer_payment(
  p_payment_id uuid,
  p_fee_tier_code text,
  p_room_id uuid,
  p_bank_reference text,
  p_session_id text,
  p_recipient_account_number text,
  p_recipient_account_name text,
  p_payer_name text,
  p_payer_bank text,
  p_remarks text,
  p_paid_at date,
  p_receipt_path text
)
RETURNS TABLE(payment_id uuid, allocation_id uuid, payment_reference text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_student_id uuid := auth.uid();
  v_email text := auth.jwt() ->> 'email';
  v_tier public.hostel_fee_tiers%rowtype;
  v_room_category text;
  v_allocation_id uuid;
  v_reference text;
begin
  if v_student_id is null or not exists (select 1 from public.students where id = v_student_id) then
    raise exception 'Only a signed-in student can submit payment evidence';
  end if;

  -- Email authorization: a one-time code must have been verified in the last 15 minutes.
  if not exists (
    select 1 from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) m
    where m ->> 'method' in ('otp', 'magiclink')
      and (m ->> 'timestamp')::bigint > extract(epoch from now()) - 900
  ) then
    raise exception 'Email authorization required: verify the code sent to your email';
  end if;

  select * into v_tier from public.hostel_fee_tiers where code = p_fee_tier_code and is_active for share;
  if not found then raise exception 'The selected hostel fee is unavailable'; end if;

  if cardinality(v_tier.eligible_room_categories) > 0 then
    select room_category into v_room_category from public.rooms where id = p_room_id;
    if v_room_category is null or not (v_room_category = any(v_tier.eligible_room_categories)) then
      raise exception 'The selected room does not match this hostel fee';
    end if;
  elsif p_room_id is not null then
    raise exception 'A room exemption payment cannot include a room';
  end if;

  if coalesce(p_recipient_account_number, '') !~ '^\d{10}$' then
    raise exception 'Recipient account number must be 10 digits';
  end if;
  if nullif(trim(p_recipient_account_name), '') is null
     or nullif(trim(p_payer_name), '') is null
     or nullif(trim(p_payer_bank), '') is null
     or nullif(trim(p_session_id), '') is null
     or nullif(trim(p_bank_reference), '') is null then
    raise exception 'Recipient, sender, session ID and reference ID are required';
  end if;
  if p_paid_at is null or p_paid_at > current_date then
    raise exception 'Transfer date cannot be in the future';
  end if;
  if p_receipt_path is null or p_receipt_path not like 'student/' || v_student_id::text || '/%' then
    raise exception 'A payment receipt upload is required';
  end if;

  select id into v_allocation_id
  from public.allocations
  where student_id = v_student_id and status = 'pending'
  order by created_at desc
  limit 1
  for update;

  if v_allocation_id is null then
    insert into public.allocations (allocation_id, student_id, request_date, status, priority, reason, notes)
    values ('AL-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)), v_student_id, current_date, 'pending', 'normal', 'regular', 'Created from hostel payment')
    returning id into v_allocation_id;
  end if;

  v_reference := 'HP-' || upper(substr(replace(p_payment_id::text, '-', ''), 1, 12));
  insert into public.hostel_payments (
    id, payment_reference, student_id, allocation_id, fee_tier_id, amount, payment_method,
    bank_reference, paid_at, receipt_path, status, room_id, session_id,
    recipient_account_number, recipient_account_name, payer_name, payer_bank, remarks, authorized_email
  ) values (
    p_payment_id, v_reference, v_student_id, v_allocation_id, v_tier.id, v_tier.amount, 'bank_transfer',
    trim(p_bank_reference), p_paid_at, p_receipt_path, 'submitted', p_room_id, trim(p_session_id),
    p_recipient_account_number, trim(p_recipient_account_name), trim(p_payer_name), trim(p_payer_bank),
    nullif(trim(p_remarks), ''), v_email
  );

  insert into public.payment_verification_events (payment_id, action, new_status, notes)
  values (p_payment_id, 'submitted', 'submitted', 'Bank transfer submitted with email authorization');

  return query select p_payment_id, v_allocation_id, v_reference;
end;
$function$;

REVOKE ALL ON FUNCTION public.submit_bank_transfer_payment(uuid, text, uuid, text, text, text, text, text, text, text, date, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.submit_bank_transfer_payment(uuid, text, uuid, text, text, text, text, text, text, text, date, text) TO authenticated;

-- Verification now prefers a bunk in the room the student chose, falling back
-- to the first available bunk in an eligible category (previous behaviour).
CREATE OR REPLACE FUNCTION public.verify_and_auto_allocate_hostel_payment(p_payment_id uuid, p_decision text, p_notes text DEFAULT NULL::text)
 RETURNS TABLE(outcome text, allocation_id uuid, block_name text, room_number text, bunk_number text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_admin_id uuid := auth.uid();
  v_payment public.hostel_payments%rowtype;
  v_categories text[];
  v_bunk record;
begin
  if not (coalesce(auth.role(), '') = 'service_role' and v_admin_id is null)
     and not exists (select 1 from public.admins where id = v_admin_id and is_active) then
    raise exception 'Only an active administrator can verify payments';
  end if;
  if p_decision not in ('verified', 'rejected') then raise exception 'A verification decision is required'; end if;
  if p_decision = 'rejected' and nullif(trim(p_notes), '') is null then raise exception 'A rejection reason is required'; end if;

  select * into v_payment from public.hostel_payments where id = p_payment_id for update;
  if not found then raise exception 'Payment not found'; end if;
  if v_payment.status <> 'submitted' then raise exception 'Only submitted payments can be reviewed'; end if;

  if p_decision = 'rejected' then
    update public.hostel_payments set status = 'rejected', rejection_reason = trim(p_notes), verification_notes = trim(p_notes), verified_by = v_admin_id, verified_at = now(), updated_at = now() where id = p_payment_id;
    insert into public.payment_verification_events (payment_id, actor_admin_id, action, old_status, new_status, notes) values (p_payment_id, v_admin_id, 'rejected', 'submitted', 'rejected', trim(p_notes));
    insert into public.notifications (type, title, message, student_id) values ('payment_rejected', 'Payment evidence needs correction', trim(p_notes), v_payment.student_id);
    return query select 'rejected'::text, v_payment.allocation_id, null::text, null::text, null::text;
    return;
  end if;

  select eligible_room_categories into v_categories from public.hostel_fee_tiers where id = v_payment.fee_tier_id and is_active;
  if v_categories is null then raise exception 'The payment fee tier is no longer active'; end if;

  select b.id as bunk_id, r.id as room_id, r.block_id, bl.name as block_name, r.room_number, b.bunk_number
  into v_bunk
  from public.bunks b
  join public.rooms r on r.id = b.room_id
  join public.blocks bl on bl.id = r.block_id
  where b.status = 'available'
    and r.room_category = any(v_categories)
  order by (r.id is not distinct from v_payment.room_id) desc, bl.name, r.room_number, b.bunk_number
  limit 1
  for update of b skip locked;

  update public.hostel_payments set status = 'verified', verification_notes = nullif(trim(p_notes), ''), verified_by = v_admin_id, verified_at = now(), updated_at = now() where id = p_payment_id;
  insert into public.payment_verification_events (payment_id, actor_admin_id, action, old_status, new_status, notes) values (p_payment_id, v_admin_id, 'verified', 'submitted', 'verified', nullif(trim(p_notes), ''));

  if v_bunk.bunk_id is null then
    if cardinality(v_categories) = 0 then
      return query select 'verified'::text, v_payment.allocation_id, null::text, null::text, null::text;
      return;
    end if;
    insert into public.payment_verification_events (payment_id, actor_admin_id, action, old_status, new_status, notes) values (p_payment_id, v_admin_id, 'waitlisted', 'verified', 'verified', 'No eligible bunk is currently available');
    insert into public.notifications (type, title, message, student_id) values ('allocation_waitlisted', 'Payment verified — allocation pending', 'Your payment is verified. Your hostel assignment will be completed when an eligible bunk becomes available.', v_payment.student_id);
    return query select 'waitlisted'::text, v_payment.allocation_id, null::text, null::text, null::text;
    return;
  end if;

  perform set_config('app.auto_allocation', 'on', true);
  update public.bunks set status = 'occupied', updated_at = now() where id = v_bunk.bunk_id;
  update public.allocations set room_id = v_bunk.room_id, block_id = v_bunk.block_id, bunk_id = v_bunk.bunk_id, status = 'approved', allocated_date = current_date, updated_at = now() where id = v_payment.allocation_id;
  update public.rooms set status = case when not exists (select 1 from public.bunks where room_id = v_bunk.room_id and status = 'available') then 'occupied' else 'free' end, updated_at = now() where id = v_bunk.room_id;
  update public.blocks set current_occupancy = (select count(*) from public.bunks b join public.rooms r on r.id = b.room_id where r.block_id = v_bunk.block_id and b.status = 'occupied'), updated_at = now() where id = v_bunk.block_id;
  insert into public.payment_verification_events (payment_id, actor_admin_id, action, old_status, new_status, notes) values (p_payment_id, v_admin_id, 'assigned', 'verified', 'verified', 'Allocated automatically: ' || v_bunk.block_name || ', room ' || v_bunk.room_number || ', bunk ' || v_bunk.bunk_number);
  insert into public.notifications (type, title, message, student_id) values ('allocation_approved', 'Hostel allocation confirmed', 'Your verified payment has been allocated to ' || v_bunk.block_name || ', room ' || v_bunk.room_number || ', bunk ' || v_bunk.bunk_number || '.', v_payment.student_id);
  return query select 'allocated'::text, v_payment.allocation_id, v_bunk.block_name, v_bunk.room_number, v_bunk.bunk_number;
end;
$function$;

-- Students must use submit_bank_transfer_payment (email-authorized); the legacy
-- path stays available to server-side (service_role) code only.
REVOKE EXECUTE ON FUNCTION public.submit_hostel_payment(uuid, text, text, text, date, text) FROM public, anon, authenticated;
