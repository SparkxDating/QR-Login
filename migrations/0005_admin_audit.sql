create table if not exists admin_audit_log (
  id serial primary key,
  actor_role text not null,
  action text not null,
  detail text not null default '',
  ip text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_at_idx
  on admin_audit_log (created_at desc);
