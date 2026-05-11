-- ============================================
-- KPKCG Koperasi — Supabase Schema
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Users (login)
create table if not exists users (
  id         serial primary key,
  username   text unique not null,
  name       text not null,
  password   text not null,  -- simpan hash bcrypt
  role       text default 'admin',
  created_at timestamptz default now()
);

-- Members
create table if not exists members (
  id         serial primary key,
  member_id  text unique not null,
  name       text not null,
  type       text default 'Calon',
  pokok      bigint default 0,
  wajib      bigint default 0,
  sukarela   bigint default 0,
  join_date  date,
  created_at timestamptz default now()
);

-- Products (Barang Ritel)
create table if not exists products (
  id         serial primary key,
  name       text not null,
  price      bigint default 0,
  hpp        bigint default 0,
  stock      int default 0,
  category   text,
  image      text,
  created_at timestamptz default now()
);

-- Consignment Products
create table if not exists consignment_products (
  id             serial primary key,
  name           text not null,
  price          bigint default 0,
  stock          int default 0,
  supplier       text,
  supplier_price bigint default 0,
  image          text,
  created_at     timestamptz default now()
);

-- Services
create table if not exists services (
  id          serial primary key,
  name        text not null,
  price       bigint default 0,
  hpp         bigint default 0,
  type        text,
  provider    text,
  is_fee_only boolean default false,
  image       text,
  created_at  timestamptz default now()
);

-- Journal
create table if not exists journal (
  id          serial primary key,
  journal_id  text not null,
  date        date not null,
  description text,
  ref         text,
  debit       bigint default 0,
  credit      bigint default 0,
  account     text,
  created_at  timestamptz default now()
);

-- Cash Loans
create table if not exists cash_loans (
  id               serial primary key,
  loan_id          text unique not null,
  member_id        text,
  name             text,
  amount           bigint default 0,
  tenor            int default 12,
  interest         decimal(5,2) default 1.5,
  status           text default 'Pending',
  remaining_amount bigint default 0,
  apply_date       date,
  take_date        date,
  created_at       timestamptz default now()
);

-- Credit Goods
create table if not exists credit_goods (
  id               serial primary key,
  credit_id        text unique not null,
  member_id        text,
  name             text,
  item_name        text,
  amount           bigint default 0,
  dp               bigint default 0,
  tenor            int default 12,
  interest         decimal(5,2) default 2.0,
  status           text default 'Pending',
  remaining_amount bigint default 0,
  apply_date       date,
  take_date        date,
  start_date       date,
  created_at       timestamptz default now()
);

-- Member Sales Transactions (untuk SHU)
create table if not exists member_sales_transactions (
  id           serial primary key,
  tx_id        text,
  date         date,
  member_id    text,
  member_name  text,
  type         text,
  amount       bigint default 0,
  created_at   timestamptz default now()
);

-- ── Enable Row Level Security ──────────────────────────────────────────────
alter table users                      enable row level security;
alter table members                    enable row level security;
alter table products                   enable row level security;
alter table consignment_products       enable row level security;
alter table services                   enable row level security;
alter table journal                    enable row level security;
alter table cash_loans                 enable row level security;
alter table credit_goods               enable row level security;
alter table member_sales_transactions  enable row level security;

-- Allow all for authenticated users (sesuaikan sesuai kebutuhan)
create policy "Allow all for authenticated" on users                     for all using (true);
create policy "Allow all for authenticated" on members                   for all using (true);
create policy "Allow all for authenticated" on products                  for all using (true);
create policy "Allow all for authenticated" on consignment_products      for all using (true);
create policy "Allow all for authenticated" on services                  for all using (true);
create policy "Allow all for authenticated" on journal                   for all using (true);
create policy "Allow all for authenticated" on cash_loans                for all using (true);
create policy "Allow all for authenticated" on credit_goods              for all using (true);
create policy "Allow all for authenticated" on member_sales_transactions for all using (true);

-- ── Seed Users ─────────────────────────────────────────────────────────────
insert into users (username, name, password, role) values
  ('aslamhadilmatin', 'Bapak Aslam',   'Aslam_040700', 'admin'),
  ('kasir',           'Mbak Kasir',    'kasir123',     'kasir'),
  ('uci',             'Ibu Uci',       '123456',       'admin'),
  ('surtini',         'Ibu Surtini',   '123456',       'admin'),
  ('indah',           'Ibu Indah',     '123456',       'admin')
on conflict (username) do nothing;

-- ── Storage Bucket untuk foto produk ──────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('kpkcg-images', 'kpkcg-images', true)
on conflict (id) do nothing;

-- Allow public read
create policy "Public read kpkcg-images"
  on storage.objects for select
  using ( bucket_id = 'kpkcg-images' );

-- Allow authenticated upload
create policy "Allow upload kpkcg-images"
  on storage.objects for insert
  with check ( bucket_id = 'kpkcg-images' );

-- Allow delete
create policy "Allow delete kpkcg-images"
  on storage.objects for delete
  using ( bucket_id = 'kpkcg-images' );
