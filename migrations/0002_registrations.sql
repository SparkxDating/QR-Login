create sequence if not exists registration_number_seq start 1;

create table if not exists registrations (
  id                      serial primary key,
  registration_number     text not null unique,
  name                    text not null,
  father_or_husband_name  text not null,
  village                 text not null,
  post                    text not null,
  nyaya_panchayat         text not null,
  block                   text not null,
  tehsil                  text not null,
  district                text not null,
  mobile                  text not null,
  note                    text,
  status                  text not null default 'registered',
  created_at              timestamptz not null default now()
);

create index if not exists registrations_mobile_idx on registrations (mobile);
create index if not exists registrations_name_idx on registrations (name);
create index if not exists registrations_block_idx on registrations (block);
create index if not exists registrations_nyaya_idx on registrations (nyaya_panchayat);
create index if not exists registrations_status_idx on registrations (status);
create index if not exists registrations_created_idx on registrations (created_at);
