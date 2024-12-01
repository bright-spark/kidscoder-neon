-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create code_snippets table
create table public.code_snippets (
  id uuid default uuid_generate_v4() primary key,
  code text not null,
  language text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.code_snippets enable row level security;

-- Create policy for public access
create policy "public_snippets_policy"
  on public.code_snippets
  as permissive
  for all
  to public
  using (true)
  with check (
    code is not null and
    language is not null and
    length(code) > 0 and
    length(code) <= 1000000
  );

-- Enable realtime
alter publication supabase_realtime add table code_snippets;