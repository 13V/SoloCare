# SoloCare — Setup Guide

## 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) → New project
2. Copy your **Project URL** and **anon/public key**
3. Open `.env.local` and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ANTHROPIC_API_KEY=your-anthropic-key
   ```

## 2. Run the Database Schema
1. In Supabase Dashboard → **SQL Editor**
2. Paste the contents of `supabase/schema.sql` and run it
3. This creates: `profiles`, `vault_documents`, `policies`, `incidents` tables with RLS

## 3. Create the Storage Bucket
In Supabase Dashboard → **Storage** → New bucket:
- Name: `vault`
- Public: ✅ (so files can be previewed via URL)

Then in SQL Editor, run these storage RLS policies:
```sql
create policy "Users can upload to own folder"
  on storage.objects for insert
  with check (bucket_id = 'vault' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view own files"
  on storage.objects for select
  using (bucket_id = 'vault' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own files"
  on storage.objects for delete
  using (bucket_id = 'vault' and auth.uid()::text = (storage.foldername(name))[1]);
```

## 4. Configure Supabase Auth
In Supabase Dashboard → **Authentication** → URL Configuration:
- Site URL: `http://localhost:3000` (dev) / your production URL
- Redirect URLs: Add `http://localhost:3000/**` and your production URL

## 5. Get Anthropic API Key
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key → paste into `.env.local`

## 6. Run the App
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## User Flow
1. Visit `/` → landing page
2. Sign up → email confirmation → redirect to `/onboarding`
3. Complete 3-step onboarding → redirect to `/dashboard`
4. Dashboard shows audit-ready status
5. Vault → upload documents with expiry dates
6. Policies → click "Generate All Policies" (needs Anthropic API key)
7. Incidents → log any NDIS incidents, download PDF reports

## Deploy to Vercel
```bash
npx vercel
```
Add all `.env.local` vars as Vercel Environment Variables.
