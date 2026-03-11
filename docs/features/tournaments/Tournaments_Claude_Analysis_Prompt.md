# Claude Task: Tournaments Feature – Analysis Only (No Implementation)

## Objective
Provide a structured analysis and recommendations for introducing a new **Tournaments** feature (admin now, coach later) without writing or modifying code. Output should be a concise Markdown report covering data model, API surface, UI/UX flows, security/RLS, and delivery plan.

## Scope & Constraints
- Feature: day/two-day round-robin tournaments (each plays each), with final standings.
- Admin portal: full lifecycle (metadata, teams, schedule generation, match edits/results, live standings, publication/blog attach, public link).
- Future coach portal: limited capabilities (read/edit where authorized).
- Public: tournament detail page (slug), homepage teaser, blog embed (schedule + standings).
- Reuse existing patterns/components/processes documented in the repo (Supabase, TanStack Query, createMutationHelpers, useMatchMutations, UnifiedStandingTable or similar, i18n, competitionTypes, RLS patterns).
- Do **not** propose changing unrelated flows; extend compatibly (e.g., matches gain tournament_id support instead of rewriting match logic).
- Deliver analysis; **no code or migration files**.

## Inputs to Consider
- Existing matches flow and standings utilities.
- Existing enums/types for competition types.
- Admin UI patterns (containers, forms, modals for matches).
- RLS/role patterns (admin, coach, public).
- Blog/article model and public site routing conventions.

## Required Output (Markdown Report)
1. **Summary**: goals, non-goals, assumptions, and open questions.
2. **Domain Model**: proposed entities/fields/relationships; note reuse vs new tables. Clarify decision: reuse `matches` with `tournament_id` vs separate table; recommend with rationale.
3. **Data Access & RLS**: access rules by role (admin/coach/public) and draft vs published; indexes/uniqueness concerns; slug strategy.
4. **API/RPC Surface**: CRUD for tournaments, team management (seed order), round-robin generator contract (idempotent, wipe toggle), matches editing, standings computation approach (on-the-fly vs persisted), blog attach, public fetch by slug. Highlight reuse of mutation/query helpers.
5. **UI/UX Flows**:
   - Admin: pages, tabs (Metadata, Teams, Schedule, Standings, Publication/Blog), primary actions, validations.
   - Public: slug page sections (meta, schedule, standings), homepage teaser, blog embed shape and data needs.
6. **Algorithm Notes**: round-robin generation (each pair once, ordering by seed), standings calculation rules, handling ties.
7. **Risks & Edge Cases**: missing results, time edits, regeneration impacts, duplicate teams, publication states, performance for embeds.
8. **Testing Plan**: unit (generator, standings), integration/hooks (mutations/queries), e2e happy path (create → teams → generate → edit results → publish → public view), and negative cases.
9. **Delivery Plan**: phased rollout steps with dependencies (migrations/types → API/hooks → admin UI → standings/live → public/blog → QA), and coach follow-up.
10. **Dependencies & TODOs**: call out required decisions (persisted standings yes/no, slug rules, blog linkage details) and any blocked items.

## Style & Format
- Write in concise English, Markdown headings/bullets.
- Keep it implementation-neutral (no code snippets or migration DDL).
- Point to relevant existing components/patterns by name, not by copying code.
- Be explicit about recommended choices and their trade-offs.

