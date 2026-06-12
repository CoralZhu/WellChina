grant usage on schema public to service_role;
grant select on table public.bookings to service_role;
grant update (status) on table public.bookings to service_role;
