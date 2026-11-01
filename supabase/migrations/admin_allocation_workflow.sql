create or replace function public.assign_verified_payment_to_bunk(
  p_allocation_id uuid,
  p_bunk_id uuid,
  p_notes text default null
)
returns table(block_name text, room_number text, bunk_number text)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_admin_id uuid := auth.uid();
  v_alloc public.allocations%rowtype;
  v_payment record;
  v_bunk record;
begin
  if not exists (select 1 from public.admins where id = v_admin_id and is_active) then
    raise exception 'Only an active administrator can assign bunks';
  end if;

  select * into v_alloc from public.allocations where id = p_allocation_id for update;
  if not found then raise exception 'Allocation not found'; end if;

  select p.id, t.eligible_room_categories into v_payment
  from public.hostel_payments p
  join public.hostel_fee_tiers t on t.id = p.fee_tier_id
  where p.allocation_id = p_allocation_id
    and p.status = 'verified'
    and cardinality(t.eligible_room_categories) > 0
  order by p.verified_at desc
  limit 1;
  if v_payment.id is null then
    raise exception 'This allocation has no verified room payment';
  end if;

  select b.id, b.status, r.id as room_id, r.block_id, r.room_category, bl.name as block_name, r.room_number, b.bunk_number
  into v_bunk
  from public.bunks b
  join public.rooms r on r.id = b.room_id
  join public.blocks bl on bl.id = r.block_id
  where b.id = p_bunk_id
  for update of b;
  if not found then raise exception 'Bunk not found'; end if;
  if v_bunk.id is distinct from v_alloc.bunk_id and v_bunk.status <> 'available' then
    raise exception 'That bunk is not available';
  end if;
  if not (v_bunk.room_category = any(v_payment.eligible_room_categories)) then
    raise exception 'The student''s payment does not cover a % room', v_bunk.room_category;
  end if;

  perform set_config('app.auto_allocation', 'on', true);

  if v_alloc.bunk_id is not null and v_alloc.bunk_id <> p_bunk_id then
    update public.bunks set status = 'available', updated_at = now() where id = v_alloc.bunk_id;
    update public.rooms set status = 'free', updated_at = now() where id = v_alloc.room_id;
  end if;

  update public.bunks set status = 'occupied', updated_at = now() where id = p_bunk_id;
  update public.allocations
  set room_id = v_bunk.room_id, block_id = v_bunk.block_id, bunk_id = p_bunk_id,
      status = 'approved', allocated_date = current_date,
      notes = coalesce(nullif(trim(p_notes), ''), notes), updated_at = now()
  where id = p_allocation_id;

  update public.rooms set status = case when exists (select 1 from public.bunks where room_id = v_bunk.room_id and status = 'available') then 'free' else 'occupied' end, updated_at = now()
  where id = v_bunk.room_id;
  update public.blocks bl set current_occupancy = (
    select count(*) from public.bunks b join public.rooms r on r.id = b.room_id
    where r.block_id = bl.id and b.status = 'occupied'), updated_at = now()
  where bl.id in (v_bunk.block_id, v_alloc.block_id);

  insert into public.payment_verification_events (payment_id, actor_admin_id, action, old_status, new_status, notes)
  values (v_payment.id, v_admin_id, 'assigned', 'verified', 'verified',
          'Assigned manually: ' || v_bunk.block_name || ', room ' || v_bunk.room_number || ', bunk ' || v_bunk.bunk_number);
  insert into public.notifications (type, title, message, student_id)
  values ('allocation_approved', 'Hostel allocation confirmed',
          'You have been allocated to ' || v_bunk.block_name || ', room ' || v_bunk.room_number || ', bunk ' || v_bunk.bunk_number || '.',
          v_alloc.student_id);

  return query select v_bunk.block_name, v_bunk.room_number, v_bunk.bunk_number;
end;
$$;

create or replace function public.release_allocation(p_allocation_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_alloc public.allocations%rowtype;
begin
  if not private.is_active_admin() then
    raise exception 'Only an active administrator can release allocations';
  end if;
  if nullif(trim(p_reason), '') is null then
    raise exception 'A reason is required';
  end if;

  select * into v_alloc from public.allocations where id = p_allocation_id for update;
  if not found then raise exception 'Allocation not found'; end if;

  if v_alloc.bunk_id is not null then
    update public.bunks set status = 'available', updated_at = now() where id = v_alloc.bunk_id;
    update public.rooms set status = 'free', updated_at = now() where id = v_alloc.room_id;
  end if;

  update public.allocations
  set status = 'rejected', bunk_id = null, notes = trim(p_reason), updated_at = now()
  where id = p_allocation_id;

  if v_alloc.block_id is not null then
    update public.blocks bl set current_occupancy = (
      select count(*) from public.bunks b join public.rooms r on r.id = b.room_id
      where r.block_id = bl.id and b.status = 'occupied'), updated_at = now()
    where bl.id = v_alloc.block_id;
  end if;

  insert into public.notifications (type, title, message, student_id)
  values ('allocation_rejected', 'Hostel allocation update', trim(p_reason), v_alloc.student_id);
end;
$$;

revoke execute on function public.assign_verified_payment_to_bunk(uuid, uuid, text) from public, anon;
revoke execute on function public.release_allocation(uuid, text) from public, anon;
grant execute on function public.assign_verified_payment_to_bunk(uuid, uuid, text) to authenticated;
grant execute on function public.release_allocation(uuid, text) to authenticated;

create policy "Active admins can manage hostel fee tiers"
  on public.hostel_fee_tiers for all to authenticated
  using (private.is_active_admin())
  with check (private.is_active_admin());

create policy "Authenticated users can read public settings"
  on public.settings for select to authenticated
  using (key in ('academic_session', 'allocation_deadline', 'bank_name', 'bank_account_number', 'bank_account_name', 'payment_instructions'));
