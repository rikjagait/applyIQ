# ApplyIQ

Private, desktop-first job-search copilot for Neelam Jagait. The application runs immediately in **Demo mode**, using fictional job data and verified résumé facts. Supabase and OpenAI integrations are opt-in via environment variables.

The primary intake workflow accepts a public HTTPS job-posting URL. ApplyIQ prefers schema.org `JobPosting` data, falls back to visible page content, and offers manual recovery for sites that block automated page access. URL fetching rejects private-network destinations, validates every redirect, and enforces response time and size limits.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Configuration

Copy `.env.example` to `.env.local`. The app remains usable in clearly labeled preview mode without credentials.

### Supabase persistence and private access

1. Create a Supabase project and apply `supabase/migrations/001_foundation.sql`.
2. Create Neelam's email/password account in Supabase Authentication.
3. Create its matching private profile:

```sql
insert into profiles (auth_user_id, full_name, location, minimum_salary, work_authorization)
select id, 'Neelam Jagait', 'Jersey City, New Jersey', 70000, array['United States','United Kingdom']
from auth.users where email = 'YOUR_LOGIN_EMAIL';
```

4. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.

When configured, all application routes require a valid Supabase session. The service-role key is reserved for future administrative jobs and must never be exposed to browser code.

### OpenAI analysis

Set `OPENAI_API_KEY` to enable server-side Responses API analysis with strict Structured Outputs. `OPENAI_MODEL` defaults to `gpt-5-mini`. Without a key, the same intake workflow uses a deterministic, explainable scorer and labels its output accordingly.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
```
