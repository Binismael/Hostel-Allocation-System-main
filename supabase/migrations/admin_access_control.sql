-- Admin roles and per-module permissions
alter table public.admins
  add column if not exists role text not null default 'admin',
  add column if not exists permissions text[] not null default '{}';

alter table public.admins drop constraint if exists admins_role_check;
alter table public.admins add constraint admins_role_check check (role in ('super_admin', 'admin'));
alter table public.admins drop constraint if exists admins_permissions_check;
alter table public.admins add constraint admins_permissions_check check (
  permissions <@ array['students', 'rooms', 'allocations', 'payments', 'room_requests', 'settings', 'admins']::text[]
);

update public.admins set role = 'super_admin' where is_active and not exists (
  select 1 from public.admins where role = 'super_admin'
);

create or replace function private.admin_can(p_permission text)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.admins
    where id = auth.uid() and is_active
      and (role = 'super_admin' or p_permission = any(permissions))
  );
$$;
grant execute on function private.admin_can(text) to authenticated;

-- Every active admin can read; changes need the matching permission.
do $$
declare
  t record;
begin
  for t in select * from (values
    ('students', 'students', 'Active admins can manage students'),
    ('rooms', 'rooms', 'Active admins can manage rooms'),
    ('blocks', 'rooms', 'Active admins can manage blocks'),
    ('bunks', 'rooms', 'Active admins can manage bunks'),
    ('allocations', 'allocations', 'Active admins can manage allocations'),
    ('room_requests', 'room_requests', 'Active admins can manage room requests'),
    ('settings', 'settings', 'Active admins can manage settings'),
    ('hostel_fee_tiers', 'settings', 'Active admins can manage hostel fee tiers')
  ) as v(tbl, perm, old_policy)
  loop
    execute format('drop policy if exists %I on public.%I', t.old_policy, t.tbl);
    execute format('drop policy if exists %I on public.%I', 'Active admins can view ' || t.tbl, t.tbl);
    execute format('drop policy if exists %I on public.%I', 'Admins with access can change ' || t.tbl, t.tbl);
    execute format('create policy %I on public.%I for select to authenticated using (private.is_active_admin())',
                   'Active admins can view ' || t.tbl, t.tbl);
    execute format('create policy %I on public.%I for all to authenticated using (private.admin_can(%L)) with check (private.admin_can(%L))',
                   'Admins with access can change ' || t.tbl, t.tbl, t.perm, t.perm);
  end loop;
end $$;

drop policy if exists "Admin managers can view admins" on public.admins;
create policy "Admin managers can view admins" on public.admins
  for select to authenticated using (private.admin_can('admins'));

-- Workflow functions require the matching permission.
do $$
declare
  v_def text;
begin
  v_def := pg_get_functiondef('public.verify_and_auto_allocate_hostel_payment(uuid, text, text)'::regprocedure);
  v_def := replace(v_def,
    'not exists (select 1 from public.admins where id = v_admin_id and is_active)',
    'not private.admin_can(''payments'')');
  if position('admin_can(''payments'')' in v_def) = 0 then raise exception 'verify function not patched'; end if;
  execute v_def;

  v_def := pg_get_functiondef('public.assign_verified_payment_to_bunk(uuid, uuid, text)'::regprocedure);
  v_def := replace(v_def,
    'not exists (select 1 from public.admins where id = v_admin_id and is_active)',
    'not private.admin_can(''allocations'')');
  if position('admin_can(''allocations'')' in v_def) = 0 then raise exception 'assign function not patched'; end if;
  execute v_def;

  v_def := pg_get_functiondef('public.release_allocation(uuid, text)'::regprocedure);
  v_def := replace(v_def, 'not private.is_active_admin()', 'not private.admin_can(''allocations'')');
  if position('admin_can(''allocations'')' in v_def) = 0 then raise exception 'release function not patched'; end if;
  execute v_def;
end $$;

create or replace function public.update_admin_access(
  p_admin_id uuid,
  p_name text,
  p_role text,
  p_permissions text[],
  p_is_active boolean
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_caller public.admins%rowtype;
  v_target public.admins%rowtype;
begin
  select * into v_caller from public.admins where id = auth.uid() and is_active;
  if not found or not private.admin_can('admins') then
    raise exception 'You do not have permission to manage admins';
  end if;
  if p_admin_id = v_caller.id then
    raise exception 'You cannot change your own access';
  end if;

  select * into v_target from public.admins where id = p_admin_id for update;
  if not found then raise exception 'Admin not found'; end if;
  if v_caller.role <> 'super_admin' and (v_target.role = 'super_admin' or p_role = 'super_admin') then
    raise exception 'Only a super admin can manage super admins';
  end if;
  if p_role not in ('super_admin', 'admin') then raise exception 'Invalid role'; end if;
  if nullif(trim(p_name), '') is null then raise exception 'Name is required'; end if;

  update public.admins
  set name = trim(p_name),
      role = p_role,
      permissions = case when p_role = 'super_admin' then '{}' else coalesce(p_permissions, '{}') end,
      is_active = p_is_active,
      updated_at = now()
  where id = p_admin_id;
end;
$$;
revoke execute on function public.update_admin_access(uuid, text, text, text[], boolean) from public, anon;
grant execute on function public.update_admin_access(uuid, text, text, text[], boolean) to authenticated;

-- Bank transfer submissions no longer require an email one-time code.
create or replace function public.submit_bank_transfer_payment(
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
returns table(payment_id uuid, allocation_id uuid, payment_reference text)
language plpgsql
security definer
set search_path to 'public'
as $function$
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
  values (p_payment_id, 'submitted', 'submitted', 'Bank transfer submitted');

  return query select p_payment_id, v_allocation_id, v_reference;
end;
$function$;
