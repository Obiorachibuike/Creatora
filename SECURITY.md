# Security notes (Part 13)

Creatora follows the security rules from the product prompt. Highlights implemented:

- **Authentication** — NextAuth v5, email+password with bcrypt hashing (10 rounds), `NEXTAUTH_SECRET` + `NEXTAUTH_URL` required.
- **RBAC / Workspace isolation** — server-side `requireUser`, `getMembership`, and project-level queries always include `workspaceId`; users without a membership get 403s.
- **Rate limiting** — `src/middleware.ts` applies per-IP limits to auth endpoints (sign-in/sign-up), generations, exports and the director route (dev fallback: in-memory map; production uses Redis or pg-boss).
- **Audit logs** — generation starts are recorded via `auditLog()` (`audit_logs` table).
- **Secrets** — provider API keys are only read from environment variables via the provider registry (`apiKeyEnvVar`); never logged or committed.
- **Provider health checks** — `checkHealth()` in `src/lib/ai/registry.ts` pings the provider base URL.

Operational notes:

- Run the DB migrations against PostgreSQL (see README) and enable `NODE_ENV=production`.
- The export renderer shells out to `ffmpeg`; set `FFMPEG_PATH` if it isn't on PATH.
