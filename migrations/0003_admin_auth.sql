create table if not exists admin_auth (
  id integer primary key check (id = 1),
  password_hash text not null,
  session_epoch integer not null default 1,
  updated_at timestamptz not null default now()
);
