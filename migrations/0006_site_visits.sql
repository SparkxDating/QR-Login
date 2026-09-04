create table if not exists site_visitors (
  visitor_key text primary key,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  hits integer not null default 1,
  last_day date not null default ((now() at time zone 'Asia/Kolkata')::date)
);

create table if not exists site_visit_days (
  day date not null primary key,
  hits integer not null default 0,
  uniques integer not null default 0
);

create index if not exists site_visitors_last_seen_idx on site_visitors (last_seen desc);
