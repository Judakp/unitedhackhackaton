# Pixel Debate

Pixel Debate is a collaborative visual debate canvas. Users choose a side, draw on the canvas, and can request a Gemini-powered sociological analysis of the drawing.

## Architecture

Browser / React + Vite
        ↓
Supabase Anonymous Auth
        ↓
Supabase Edge Function: analyze
        ↓
PostgreSQL daily quota
        ↓
Gemini API

The Gemini API key is never exposed to the browser.

## Supabase setup

1. Create a Supabase project.
2. Enable Anonymous Sign-Ins in Supabase Auth.
3. Run the SQL migration:

   `supabase/migrations/202610050001_ai_usage_daily.sql`

4. Deploy the Edge Function:

   `supabase/functions/analyze/index.ts`

5. In Supabase Edge Function secrets, configure:

   `GEMINI_API_KEY=...`

   Optional:

   `GEMINI_MODEL=gemini-3.6-flash`

6. The function is configured with JWT verification in:

   `supabase/config.toml`

## Netlify environment variables

Set these variables in Netlify:

`VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co`

`VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY`

Do not put `GEMINI_API_KEY` in Netlify `VITE_*` variables.

After changing Vite environment variables, redeploy the site.

## Daily AI limit

The Edge Function limits each authenticated/anonymous Supabase user to 10 AI analyses per UTC day.

The limit is enforced server-side through the PostgreSQL function `consume_ai_usage`. It cannot be bypassed by changing frontend JavaScript.

There is also a short server-side cooldown between requests on the same Edge Function instance.

## Security protections

The Edge Function:

- verifies the Supabase JWT;
- validates the request body;
- limits image payload size;
- accepts PNG data URLs only;
- limits debate topic length;
- treats topics as untrusted data;
- protects against prompt-injection attempts through system instructions;
- never exposes the Gemini API key;
- limits usage to 10 analyses per day;
- retries temporary Gemini 503 errors once;
- returns generic provider errors to the browser while keeping details in Supabase logs.

## Local development

Create `.env.local`:

`VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co`

`VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY`

Then:

`npm install`

`npm run dev`

The Gemini key must remain in Supabase Edge Function secrets, not in `.env.local`.
