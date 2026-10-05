create table if not exists public.ai_usage_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  request_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date),
  constraint ai_usage_daily_request_count_nonnegative
    check (request_count >= 0)
);

alter table public.ai_usage_daily enable row level security;

create or replace function public.consume_ai_usage(
  p_user_id uuid,
  p_daily_limit integer
)
returns table (
  allowed boolean,
  used integer,
  remaining integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
  current_date_utc date :=
    (timezone('UTC', now()))::date;
  next_count integer;
begin
  if p_daily_limit <= 0 then
    raise exception 'Daily limit must be greater than zero';
  end if;

  insert into public.ai_usage_daily (
    user_id,
    usage_date,
    request_count
  )
  values (p_user_id, current_date_utc, 0)
  on conflict (user_id, usage_date) do nothing;

  select request_count
  into current_count
  from public.ai_usage_daily
  where user_id = p_user_id
    and usage_date = current_date_utc
  for update;

  if current_count >= p_daily_limit then
    return query select false, current_count, 0;
    return;
  end if;

  next_count := current_count + 1;

  update public.ai_usage_daily
  set request_count = next_count,
      updated_at = now()
  where user_id = p_user_id
    and usage_date = current_date_utc;

  return query
    select true,
      next_count,
      greatest(p_daily_limit - next_count, 0);
end;
$$;

revoke all on function public.consume_ai_usage(uuid, integer) from public;
grant execute on function public.consume_ai_usage(uuid, integer) to service_role;

revoke all on table public.ai_usage_daily from anon, authenticated;
