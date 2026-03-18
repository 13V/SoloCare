# SoloCare — CLAUDE.md

SoloCare is an Australian NDIS compliance SaaS for sole operators and small support workers.
Domain: solocare.au | Stack: Next.js 16 (App Router), Supabase, Stripe, Resend, Anthropic SDK.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router, React 19, TypeScript 5 |
| Database / Auth | Supabase (Postgres + RLS + SSR auth) |
| Billing | Stripe (subscriptions, webhooks) |
| Email | Resend |
| AI | Anthropic SDK (`@anthropic-ai/sdk`) — policy & agreement generation |
| UI | Tailwind CSS, Radix UI primitives, Lucide icons, Shadcn/ui pattern |
| PDF | jspdf + html2canvas |
| Deployment | Vercel |

## Project Structure

```
app/
  (auth)/          # login, signup, reset-password
  (app)/           # protected routes (dashboard, participants, policies,
                   #   incidents, vault, notes, checklist, shifts,
                   #   onboarding, settings, subscribe)
  api/
    generate-policy/    # Anthropic-powered NDIS policy generation
    generate-agreement/ # Anthropic-powered agreement generation
    send-reminders/     # Resend email reminders
    stripe/             # Stripe checkout + webhook handlers
  layout.tsx
components/
  ui/              # Shadcn/ui components
  policies/        # Policy-specific components
  incidents/       # Incident-specific components
  vault/           # Secure document vault components
  layout/          # Shared layout components
lib/
  supabase/        # Supabase client factories (server + browser + middleware)
  stripe.ts        # Stripe client and helpers
  utils.ts         # cn(), general utilities
  types.ts         # Shared TypeScript types
  types-features.ts
supabase/
  schema.sql
  features_migration.sql
  stripe_migration.sql
middleware.ts      # Supabase session refresh on every request
```

## Critical Rules

### SDK Instantiation — IMPORTANT

**Never instantiate SDK clients at module level.** Always create them inside the request handler or Server Action:

```typescript
// WRONG — module-level instantiation breaks Next.js edge runtime
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// CORRECT — inside the handler
export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // ...
}
```

This applies to: Stripe, Anthropic, Resend, and Supabase service-role clients.

### Supabase Auth

- Use `createServerClient()` from `@supabase/ssr` in Server Components and Route Handlers
- Use `createBrowserClient()` from `@supabase/ssr` in Client Components
- Auth check: always use `supabase.auth.getUser()` — never trust `getSession()` alone
- Middleware at `middleware.ts` refreshes tokens on every request

### Database

- All queries use Supabase with RLS enabled — never bypass RLS
- Migrations live in `supabase/` — never modify the DB directly
- Use explicit column selects, not `select('*')`
- All user-facing queries must include `.limit()` to prevent unbounded results

### Stripe

- Webhook handler: `app/api/stripe/` — always verify the Stripe signature
- Never trust client-side price data — fetch from Stripe server-side
- Subscription status synced via webhook into Supabase

### Anthropic (AI)

- Used for NDIS policy and agreement generation
- Prompt templates in the respective API route files
- Stream responses where possible for UX
- Always sanitise user-supplied context before inserting into prompts

### Code Style

- No emojis in code or comments
- Immutable patterns — spread operator, never mutate
- Server Components by default; `'use client'` only where interactivity is required
- Zod for all input validation (API routes, Server Actions, env vars)
- No `console.log` in committed code — use structured logging or remove

## API Response Format

```typescript
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }
```

## Server Action Pattern

```typescript
'use server'

import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'

const schema = z.object({ name: z.string().min(1).max(100) })

export async function createParticipant(formData: FormData) {
  const parsed = schema.safeParse({ name: formData.get('name') })
  if (!parsed.success) return { success: false, error: parsed.error.flatten() }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('participants')
    .insert({ name: parsed.data.name, user_id: user.id })
    .select('id, name, created_at')
    .single()

  if (error) return { success: false, error: 'Failed to create participant' }
  return { success: true, data }
}
```

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # Server-only — never expose to client

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Resend
RESEND_API_KEY=

# Anthropic
ANTHROPIC_API_KEY=                # Server-only

# App
NEXT_PUBLIC_APP_URL=https://solocare.au
```

## NDIS Compliance Context

SoloCare helps Australian NDIS sole operators:
- Generate compliant NDIS policies and service agreements
- Log and manage incidents (mandatory NDIS reporting)
- Maintain a secure document vault
- Track participants, shifts, and notes
- Receive email reminders for compliance deadlines

Keep Australian English spelling in all user-facing copy (e.g. "organise", "colour", "behaviour").

## Git Workflow

- `feat:` new features, `fix:` bug fixes, `refactor:` restructuring
- Feature branches from `main`, PRs required
- Deploy: Vercel preview on PR, production on merge to `main`
