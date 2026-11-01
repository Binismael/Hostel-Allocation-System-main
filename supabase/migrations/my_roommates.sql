create or replace function public.my_roommates()
returns table(name text, bunk_number text)
language sql
stable
security definer
set search_path to 'public'
as $$
  select s.name, b.bunk_number
  from public.allocations mine
  join public.allocations other on other.room_id = mine.room_id
    and other.student_id <> mine.student_id and other.status = 'approved'
  join public.students s on s.id = other.student_id
  left join public.bunks b on b.id = other.bunk_id
  where mine.student_id = auth.uid() and mine.status = 'approved' and mine.room_id is not null
  order by b.bunk_number;
$$;
revoke execute on function public.my_roommates() from public, anon;
grant execute on function public.my_roommates() to authenticated;
