alter table registrations add column if not exists screening_date date;
alter table registrations add column if not exists surgery_date date;
alter table registrations add column if not exists follow_up_date date;
alter table registrations add column if not exists follow_up_status text not null default '';
alter table registrations add column if not exists follow_up_notes text;
