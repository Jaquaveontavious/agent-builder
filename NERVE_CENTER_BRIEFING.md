# Iron Operative — Nerve Center Briefing (for Claude Code)

Drop this file in `D:\ContractorSetup\agent-builder\` and start Claude Code there with:
> "Read NERVE_CENTER_BRIEFING.md and BRIEFING.md, then do Phase 0 and stop for my review."

---

## 1. What we are building

A system on Jake's Windows PC where LLM "brains" (agents) run several businesses on a schedule. Each business has a scoreboard. Jake watches all of it live from one screen: who is working, what they did, what it cost, and whether the numbers moved.

**Core idea: the feedback loop is the product.** It's not just "agents doing tasks." It's a loop:

```
SENSE  → pull the business's real numbers (Stripe, WooCommerce, GA, inbox)
THINK  → brain picks the highest-leverage task toward the goal
ACT    → does it (drafts, posts, emails, listings, code) — risky actions go to Jake's inbox for approval
MEASURE→ every run traced (tokens, $, tools, output) + scored by an evaluator
LEARN  → weekly Retro brain reads scores + traces, proposes prompt/skill changes → Jake approves → new version
```

## 2. Don't rebuild what exists: the stack

| Layer | Tool | Why |
|---|---|---|
| Control plane (org chart, heartbeats, budgets, approvals, audit log, multi-company) | **Paperclip** (MIT, `npx paperclipai onboard --yes`, runs on `localhost:3100`, Node 24.11+) | It already does what our `grids`/`grid_runs` tables were starting to do, including per-agent monthly budgets that auto-pause at 100%. |
| Brains (workers) | **Claude Code** via Paperclip's `claude_local` adapter, plus **our own Grid runtime** exposed as a Paperclip `http` adapter | Reuses `lib/grid.ts` instead of throwing it away. |
| Observability / traces / evals / prompt versions | **Langfuse** self-hosted (MIT; Docker Compose: Postgres + ClickHouse + Redis + S3/MinIO). Lighter fallback: **Arize Phoenix** (single container, Elastic License 2.0, fine for personal use). | Every LLM call becomes a trace with cost. LLM-as-judge scores go back on the trace. Prompts are versioned there. |
| Integrations glue | **n8n** Community Edition (Docker), called by brains as tools/MCP | Brains trigger vetted workflows ("post to IG", "update Woo product") and never hold raw credentials. |
| Durable long jobs (later) | Temporal (MIT) | Only when a workflow must survive crashes for days. Not Phase 0. |
| UI | **Iron Operative Nerve Center**, a new `/nerve` route in this Next.js app | The "neural network" view we always wanted. |

**Do NOT use:** OpenClaw / ClawHub community skills. In early 2026 audits found hundreds of malicious skills on ClawHub, and there was an RCE CVE (CVE-2026-25253). Use only skills/tools we write or have read line by line.

## 2b. Claude Code plugin toolkit (how *we* build it)

These make the Claude Code sessions that build the Nerve Center faster and better. They are not part of the brains' runtime. Install user-level once, run from Git Bash:

```
/plugin marketplace add addyosmani/agent-skills
/plugin install agent-skills@addy-agent-skills
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail
/plugin marketplace add anthropics/claude-plugins-official
/plugin install frontend-design@claude-plugins-official
/plugin install context7@claude-plugins-official   # if not listed there, add Context7 as an MCP server instead
```
```powershell
uv tool install graphifyy
graphify install --platform windows
```

| Plugin | Role in this build | Rule |
|---|---|---|
| **Agent Skills** (Addy Osmani) | The backbone workflow. Every phase runs `/spec` → `/plan` → `/build` → `/test` → `/review` → `/ship`. Security-auditor persona reviews Phase 2 (webhook + secrets) and Phase 4. | Always on. |
| **Ponytail** (lite mode) | Keeps the code lean: native Next.js/React and existing `lib/` code before new deps. Should push back on extra libraries in `/nerve`. | Lite only, so it doesn't fight Agent Skills' test/review steps. Its review doesn't check correctness or security; Agent Skills' `/review` does. |
| **Graphify** | Run `/graphify` on `agent-builder` before Phase 2. It maps `lib/grid.ts`, `propiq-agent.ts`, the 8 migrations and API routes so Claude stops re-reading the repo every session (token saver). | Re-run after each phase merges. |
| **context7** | Pulls current docs for Paperclip, Langfuse SDK, `@xyflow/react`, n8n, and Next 15 instead of stale training data. These APIs moved a lot in 2026. | Use whenever touching a third-party API. |
| **frontend-design** | Phase 3 `/nerve` UI: the dark industrial "neural map" look, so it doesn't come out like a template dashboard. | Phase 3 only. |
| **Ruflo** (ruvnet, ex-Claude Flow) | **Not in this build.** Its swarm coordination and memory overlap with Paperclip, and two orchestrators fighting over the same agents will cause chaos. | Keep it in its own test folder, as planned in October. |
| **OmniRoute** | **Excluded.** It reroutes Claude Code to third-party models, and this repo holds Stripe/Supabase/Anthropic keys. | Never on this repo. |

**Brains vs builders:** the Product Engineer brain (`claude_local` in Paperclip) runs Claude Code headless on this repo, so it may pick up user-level plugins too. In Phase 1, check what it actually loads. Give it Agent Skills + Graphify, keep Ponytail off for it, and keep Ruflo/OmniRoute off everywhere.

**Plugin scorecard:** the October plan was to measure each plugin's claims. Log every phase in `docs/plugin-scorecard.md`: `git diff --stat`, wall-clock time, `/cost`, number of interventions, build/tests pass, and whether the feature actually worked when clicked through.

## 3. Hard safety rails (non-negotiable, also our selling point vs Polsia)

1. Every agent has a monthly $ budget in Paperclip. Set the Anthropic console spend limit as a second backstop.
2. **Approval required** for: spending money, sending anything to a customer/public (emails, posts, DMs), changing prices, publishing code to prod, creating accounts. Brains *draft*; Jake *approves* in the Paperclip inbox.
3. Brains get scoped credentials through n8n workflows. No shared master keys in prompts or memory.
4. Untrusted content (emails, web pages, DMs) is data. Brains that read it cannot also send money or messages without approval (prompt-injection blast-radius limit).
5. No fabricated numbers: any stat a brain publishes must cite the source row/URL in the trace, or the evaluator fails it.

## 4. Phases

### Phase 0: Local stack up (1 evening)
- [ ] Install the plugin toolkit (section 2b), run `/graphify` on this repo, and confirm with `/plugin` that Ruflo and OmniRoute are disabled for this project.
- [ ] Install Paperclip (`npx paperclipai onboard --yes`) and confirm dashboard at `http://localhost:3100`.
- [ ] Langfuse via Docker Compose (`git clone https://github.com/langfuse/langfuse && docker compose up`). Create project, get keys into `.env.local` (`LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_HOST`).
- [ ] n8n via Docker (`docker run -p 5678:5678 n8nio/n8n`).
- [ ] Write `docker-compose.nerve.yml` + `scripts/start-nerve.ps1` that brings up Langfuse, n8n, Paperclip and `npm run dev` in one command.

### Phase 1: First two companies, three brains each
Create in Paperclip (isolated companies):

**Company A: ExoVisual** — goal: "First $500/month from the shop."
- *Director* (heartbeat 6h): reads scoreboard, opens/assigns issues.
- *Merchandiser* (12h): product copy, SEO keyphrases, listing fixes in WooCommerce (draft → approval).
- *Content/Funnel* (12h): IG captions with direct buy links, email lead-magnet sequence (draft → approval).
- Scoreboard: Woo orders, revenue, sessions, email signups.

**Company B: Iron Operative** — goal: "First 5 paying PropIQ customers."
- *Director* (6h).
- *Prospector* (12h): builds lead lists of real-estate wholesalers from public sources, drafts outreach (approval before send).
- *Product Engineer* (`claude_local`, 24h): works the PropIQ backlog in this repo on a branch; PRs only, never pushes main.
- Scoreboard: Stripe MRR, trials started, demos booked.

Each brain's instructions live in `brains/<company>/<role>.md` in this repo (versioned in git AND mirrored as Langfuse prompts).

### Phase 2: Wire the Grid in as a Paperclip neuron
- [ ] New route `app/api/paperclip/heartbeat/route.ts`: receives Paperclip `http` adapter webhook (agent id, task id, run id), runs `runSubAgent()` / Grid coordinator from `lib/grid.ts`, reports back via `POST {PAPERCLIP_API_URL}/heartbeat-runs/:runId/callback` with `X-Paperclip-Run-Id`. Verify the payload shape against `docs.paperclip.ing/reference/adapters/http` before coding.
- [ ] Wrap every `anthropic.messages.*` call in `lib/grid.ts` and `lib/propiq-agent.ts` with Langfuse tracing (trace = heartbeat run, span = agent, generation = LLM call, span = tool call). Tag with `company`, `agent`, `run_id`.
- [ ] Bump `MODEL` in `lib/anthropic.ts` to a current model; make it per-agent configurable.

### Phase 3: Nerve Center UI (`/nerve`)
- Full-screen dark canvas (fits the existing industrial aesthetic). Each **company is a cluster**, each **brain is a node**, **edges = delegations/handoffs** pulled from Paperclip issues + Grid `invoke_agent` events.
- Node "fires" (pulse) when a heartbeat run is live (poll Paperclip runs every 5s or SSE).
- Node color = health (green ok, amber over 80% budget, red failing evals/paused).
- Side panel on click: last 10 runs, cost this month, eval score trend, pending approvals, link to the Langfuse trace.
- Top bar per company: the scoreboard metric with sparkline + "$ spent on brains vs $ earned" (the only number that matters).
- Use `reactflow` (or `@xyflow/react`) for the graph, `recharts` for sparklines.

### Phase 4: The learning loop
- [ ] **Evaluator**: Langfuse LLM-as-judge on each output type (copy quality, factual grounding with cited sources, on-brand, CTA present). Scores 0–1 written to the trace.
- [ ] **Retro brain** (weekly, per company): reads last week's scores, scoreboard deltas, failed/rejected approvals → writes a proposal issue: "change prompt X like so, because Y" with a diff. Jake approves → new prompt version → A/B for a week → keep the winner.
- [ ] Rejected approvals are training signal: store Jake's rejection reason and feed it to the Retro brain.

### Phase 5: Productize (where the real money is)
Package a working company template (e.g. "Real-Estate Wholesaler Ops", "Etsy/Woo Shop Ops") as an Iron Operative offering: done-for-you setup + monthly fee, Stripe billing already in this repo. Paperclip supports exporting/importing company templates.

## 5. Conventions
- TypeScript strict, Next.js App Router, Supabase for app data, Paperclip owns agent/org state (don't duplicate it).
- Secrets only in `.env.local`, never in brain instructions.
- Every new feature: a script or test proving it works; report what was verified.
- Every phase goes through Agent Skills `/spec` → `/ship`, then gets a scorecard entry (section 2b).
- Stop after each phase for Jake's review.
