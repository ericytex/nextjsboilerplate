# Supabase Integration Files

This document explains the Supabase integration files and their usage.

## File Structure

Following Supabase's recommended structure for Next.js App Router:

```
utils/
  supabase/
    server.ts    - Server-side client (Server Components & API Routes)
    client.ts    - Client-side client (Client Components)
    middleware.ts - Middleware client (for auth in middleware)
lib/
  supabase.ts    - Legacy/alternative server client (still works)
  supabase-client.ts - Helper for custom credentials
```

## Files Overview

### 1. `utils/supabase/server.ts` ✅

**Purpose:** Server-side Supabase client for Server Components and API Routes

**Features:**
- Uses `@supabase/ssr` for proper cookie handling
- Automatically handles session refresh
- Works in Server Components and API Routes

**Usage:**
```tsx
// In Server Component or API Route
import { createClient } from '@/utils/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.from('users').select('*')
  return <div>{/* ... */}</div>
}
```

**Service Role Client:**
```tsx
// For admin operations (bypasses RLS)
import { createServiceClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = createServiceClient()
  const { data } = await supabase.from('users').select('*')
  return Response.json(data)
}
```

### 2. `utils/supabase/client.ts` ✅

**Purpose:** Client-side Supabase client for Client Components

**Features:**
- Uses `@supabase/ssr` for proper cookie handling
- Automatically handles session refresh
- Works in Client Components only

**Usage:**
```tsx
'use client'
import { createClient } from '@/utils/supabase/client'

export default function Component() {
  const supabase = createClient()
  // Use supabase in useEffect, event handlers, etc.
}
```

### 3. `utils/supabase/middleware.ts` ✅

**Purpose:** Supabase client for Next.js middleware

**Features:**
- Handles authentication state in middleware
- Properly manages cookies
- Returns both supabase client and response

**Usage:**
```tsx
// In middleware.ts
import { createClient } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/signin', request.url))
  }
  
  return response
}
```

### 4. `lib/supabase.ts` ✅ (Legacy, still works)

**Purpose:** Alternative server/client clients

**Features:**
- `createServerClient()` - Server-side client
- `createBrowserClient()` - Client-side client
- `isSupabaseConfigured()` - Check if Supabase is configured

**Usage:**
```tsx
// Server-side
import { createServerClient } from '@/lib/supabase'
const supabase = createServerClient()

// Client-side
import { createBrowserClient } from '@/lib/supabase'
const supabase = createBrowserClient()
```

### 5. `lib/supabase-client.ts` ✅

**Purpose:** Helper for custom credentials (used in setup flow)

**Features:**
- `createSupabaseClient(url, key)` - Create client with custom credentials
- Used during initial setup before env vars are set

## Environment Variables

Create `.env.local` file (see `.env.local.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_service_...
```

## Which File to Use?

### Server Components / API Routes
→ Use `@/utils/supabase/server`

### Client Components
→ Use `@/utils/supabase/client`

### Middleware
→ Use `@/utils/supabase/middleware`

### Legacy Code / Setup Flow
→ Use `@/lib/supabase` or `@/lib/supabase-client`

## Example: Authentication

### Sign Up
```tsx
'use client'
import { createClient } from '@/utils/supabase/client'

const supabase = createClient()
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})
```

### Sign In
```tsx
'use client'
import { createClient } from '@/utils/supabase/client'

const supabase = createClient()
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})
```

### Get Current User (Server)
```tsx
import { createClient } from '@/utils/supabase/server'

const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

### Get Current User (Client)
```tsx
'use client'
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

const supabase = createClient()
const [user, setUser] = useState(null)

useEffect(() => {
  supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
}, [])
```

## Example: Database Queries

### Server Component
```tsx
import { createClient } from '@/utils/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data: users } = await supabase.from('users').select('*')
  return <div>{/* ... */}</div>
}
```

### API Route
```tsx
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('users').select('*')
  
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ users: data })
}
```

### Client Component
```tsx
'use client'
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

export default function Component() {
  const [users, setUsers] = useState([])
  const supabase = createClient()
  
  useEffect(() => {
    supabase.from('users').select('*').then(({ data }) => setUsers(data))
  }, [])
  
  return <div>{/* ... */}</div>
}
```

## Migration from lib/supabase.ts

If you're using `@/lib/supabase`, you can migrate to the new structure:

**Old:**
```tsx
import { createServerClient } from '@/lib/supabase'
const supabase = createServerClient()
```

**New:**
```tsx
import { createClient } from '@/utils/supabase/server'
const supabase = await createClient() // Note: await in Server Components
```

## Notes

- `@/utils/supabase/*` uses `@supabase/ssr` package (recommended by Supabase)
- `@/lib/supabase` uses `@supabase/supabase-js` directly (still works)
- Both are compatible and can be used together
- The setup flow uses `@/lib/supabase-client` for flexibility during initial setup

