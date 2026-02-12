# RecruitMail AI

RecruitMail AI is a production-structured monorepo that ingests recruiter emails from Gmail, Outlook, and SMTP/IMAP accounts, extracts structured jobs with LLMs, and supports draft-to-posted publishing workflows.

## Tech Stack
- Next.js 14 (App Router) + TailwindCSS
- PostgreSQL + Prisma
- PostgreSQL queue (`FOR UPDATE SKIP LOCKED`)
- Worker service with OpenAI or Ollama extraction provider
- Docker Compose orchestration

## Monorepo Layout
- `apps/web` - UI and API routes
- `apps/worker` - queue processor
- `packages/db` - Prisma schema/client exports
- `packages/extraction` - cleaner/parser/prompt/provider/schema
- `packages/queue` - enqueue/claim/complete/fail operations

## Environment Setup
```bash
cp .env.example .env
```

Fill OAuth and provider variables in `.env`.

## Run Locally
```bash
docker compose up --build
```

Open `http://localhost:3000`.

## Core Workflow
1. Connect Gmail / Outlook via OAuth or create SMTP/IMAP account.
2. Fetch account emails into PostgreSQL.
3. Click **Extract Job** on an email.
4. Queue record is created (`JobQueue`).
5. Worker claims queue item with `FOR UPDATE SKIP LOCKED`.
6. Worker cleans/parses email, performs dedupe hash check, calls LLM, validates with Zod, inserts `Job`, marks email extracted.
7. Manage `DRAFT` jobs in Extracted page; post to `POSTED` page.

## Notes
- Single-user mode, no authentication.
- No secrets are hardcoded.
- Token refresh is handled for Google and Microsoft account fetches.
