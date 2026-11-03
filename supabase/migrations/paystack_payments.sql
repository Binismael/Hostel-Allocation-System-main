create or replace function public.record_paystack_payment(
  p_student_id uuid,
  p_fee_tier_code text,
  p_room_id uuid,
  p_reference text,
  p_amount numeric,
  p_paid_at date,
  p_payer_email text,
  p_channel text
)
returns table(payment_reference text, outcome text, block_name text, room_number text, bunk_number text)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tier public.hostel_fee_tiers%rowtype;
  v_room_category text;
  v_allocation_id uuid;
  v_payment_id uuid := gen_random_uuid();
  v_reference text;
  v_existing public.hostel_payments%rowtype;
  v_result record;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Paystack payments can only be recorded by the payment server';
  end if;
  if nullif(trim(p_reference), '') is null then
    raise exception 'A Paystack reference is required';
  end if;

  select * into v_existing from public.hostel_payments
  where payment_method = 'paystack' and bank_reference = trim(p_reference);
  if found then
    return query
      select v_existing.payment_reference, 'already_recorded'::text, bl.name, r.room_number, b.bunk_number
      from (select 1) x
      left join public.allocations a on a.id = v_existing.allocation_id
      left join public.bunks b on b.id = a.bunk_id
      left join public.rooms r on r.id = a.room_id
      left join public.blocks bl on bl.id = a.block_id;
    return;
  end if;

  if not exists (select 1 from public.students where id = p_student_id) then
    raise exception 'Student not found';
  end if;

  select * into v_tier from public.hostel_fee_tiers where code = p_fee_tier_code and is_active;
  if not found then raise exception 'The selected hostel fee is unavailable'; end if;
  if p_amount <> v_tier.amount then
    raise exception 'Paid amount does not match the hostel fee';
  end if;

  if cardinality(v_tier.eligible_room_categories) > 0 then
    select room_category into v_room_category from public.rooms where id = p_room_id;
    if v_room_category is null or not (v_room_category = any(v_tier.eligible_room_categories)) then
      raise exception 'The selected room does not match this hostel fee';
    end if;
  elsif p_room_id is not null then
    raise exception 'A room exemption payment cannot include a room';
  end if;

  select id into v_allocation_id
  from public.allocations
  where student_id = p_student_id and status = 'pending'
  order by created_at desc
  limit 1
  for update;

  if v_allocation_id is null then
    insert into public.allocations (allocation_id, student_id, request_date, status, priority, reason, notes)
    values ('AL-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)), p_student_id, current_date, 'pending', 'normal', 'regular', 'Created from Paystack payment')
    returning id into v_allocation_id;
  end if;

  v_reference := 'HP-' || upper(substr(replace(v_payment_id::text, '-', ''), 1, 12));
  insert into public.hostel_payments (
    id, payment_reference, student_id, allocation_id, fee_tier_id, amount, payment_method,
    bank_reference, paid_at, receipt_path, status, room_id, payer_bank, authorized_email
  ) values (
    v_payment_id, v_reference, p_student_id, v_allocation_id, v_tier.id, v_tier.amount, 'paystack',
    trim(p_reference), coalesce(p_paid_at, current_date), 'paystack:' || trim(p_reference), 'submitted',
    p_room_id, 'Paystack' || coalesce(' (' || nullif(trim(p_channel), '') || ')', ''), p_payer_email
  );

  insert into public.payment_verification_events (payment_id, action, new_status, notes)
  values (v_payment_id, 'submitted', 'submitted', 'Paid online with Paystack');

  perform set_config('app.payment_action', 'verify', true);
  select * into v_result
  from public.verify_and_auto_allocate_hostel_payment(v_payment_id, 'verified', 'Confirmed automatically by Paystack');

  return query select v_reference, v_result.outcome, v_result.block_name, v_result.room_number, v_result.bunk_number;
end;
$$;

revoke execute on function public.record_paystack_payment(uuid, text, uuid, text, numeric, date, text, text) from public, anon, authenticated;
grant execute on function public.record_paystack_payment(uuid, text, uuid, text, numeric, date, text, text) to service_role;
