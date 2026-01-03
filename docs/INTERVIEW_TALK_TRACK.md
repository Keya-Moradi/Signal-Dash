# Interview Talk Track — Signal Dash

## 30-Second Pitch

"Signal Dash is a lightweight experiment platform I built to demonstrate full-stack TPM capabilities. It takes experiments from intake through approval, running, readout, and decision. The focus was on showing SQL analytics, ops workflow design, backend API implementation, and practical AI integration."

## What I Built (20-second version)

- **Defined the workflow and SOP** for experiments (Draft → Review → Running → Readout → Shipped/Killed)
- **Designed the schema + constraints** to prevent bad data (CHECK constraints, unique indexes)
- **Implemented a tracking API** with atomic dedup via unique index + ON CONFLICT
- **Built analysis** using distinct users as the unit of analysis (COUNT DISTINCT)
- **Removed an N+1 query pattern** by consolidating into one aggregate SQL query
- **Added optional AI readout** with caching + timeout + fallback

## Key Tradeoffs (Be Ready to Defend)

### Server-Rendered UI
- **Why:** Avoided frontend build complexity to focus on backend + analytics
- **Tradeoff:** Less interactive, but sufficient for internal tool MVP

### Simple z-Test
- **Why:** Explainable to non-statisticians, works well for basic A/B tests
- **Tradeoff:** Not as robust as Bayesian methods, requires larger samples
- **Disclosure:** Shows warnings for small samples and documents limitations

### Dedup at (experiment_id, user_key, event_type)
- **Why:** Matches MVP assumption that assignment happens upstream and is stable
- **Tradeoff:** Doesn't enforce variant-level consistency
- **Next Step:** Add assignment table and enforce at (experiment_id, variant_id, user_key, event_type)

### No Assignment Engine
- **Why:** Focused on analytics/readout, not randomization
- **Assumption:** Application handles assignment upstream
- **Next Step:** Add variant assignment API if needed

## Technical Decisions I'd Defend

### Database-Enforced Integrity
- CHECK constraint on event_type (only 'exposure' or 'conversion')
- Unique index prevents duplicates atomically (no race conditions)
- Validates variant belongs to experiment at API level

### COUNT(DISTINCT user_key)
- **Unit of analysis:** Unique users, not raw events
- Matches README claim exactly
- Single efficient query vs N+1 pattern

### AI Readout Strategy
- **Optional:** Works without API keys (deterministic fallback)
- **Cached:** Prevents repeated costs, 30-second timeout prevents hangs
- **Transparent:** Shows source (openai/anthropic/fallback)

## What I'd Do Next (Prioritized)

1. **Auth** — Basic password gate or OAuth (currently none)
2. **Assignment table** — Track variant assignments, enforce consistency
3. **Conversion-without-exposure blocking** — Reject conversions if no prior exposure
4. **Rate limiting** — Prevent abuse on tracking endpoint
5. **Audit trail** — Log all status changes and decisions
6. **Multi-metric support** — Beyond just conversion rate
7. **Sequential testing** — Early stopping rules
8. **Bayesian analysis** — More robust for small samples

## Common Questions & Answers

### "Is this production-ready?"
"No, it's an MVP to demonstrate capabilities. For production, I'd add auth, rate limiting, audit trails, and more robust assignment tracking. But it's solid for an internal demo tool."

### "Why unique index on (experiment_id, user_key, event_type) vs (experiment_id, variant_id, user_key, event_type)?"
"MVP assumes assignment happens upstream and is stable. The current index enforces one exposure and one conversion per user per experiment total, which is sufficient if we trust upstream assignment. For stricter correctness, I'd add an assignment table and use the variant-level index."

### "How do you handle bots or invalid traffic?"
"Currently not filtered. For production, I'd add user-agent filtering, rate limiting by IP/user_key, and potentially a bot detection service. This is explicitly called out in 'What I'd do next.'"

### "What if conversion happens before exposure?"
"Currently allowed but detectable via timestamp comparison. I'd add a validation check to reject conversions without prior exposure if data quality is critical."

### "Why not use an ORM?"
"Wanted to show raw SQL understanding for analytics queries. ORMs can obscure performance issues (like N+1 queries) and make optimization harder to demonstrate."

## Interview Positioning

**For TPM roles:** Emphasize workflow design, SOP documentation, ops thinking, and decision framework.

**For backend roles:** Emphasize SQL optimization, race condition fixes, schema design, and API implementation.

**For analytics roles:** Emphasize statistical method choice, unit of analysis, data integrity, and result interpretation.

**For full-stack roles:** Show breadth across all layers while acknowledging simplifications made for MVP scope.

## What This Demonstrates

- **SQL + Analytics:** Complex aggregation queries, statistical calculations, data integrity
- **Ops Workflow:** Status state machine, SLA tracking, decision logging
- **Backend Engineering:** REST API, validation, error handling, performance optimization
- **Practical AI:** LLM integration with fallback, cost control via caching
- **System Design:** Tradeoff analysis, scalability considerations, clear documentation

## Red Flags to Avoid

❌ "This is production-ready"
✅ "This is robust for an MVP / demo tool"

❌ "This proves statistical significance"
✅ "This shows evidence of / suggests a significant difference"

❌ "Bulletproof deduplication"
✅ "Atomic deduplication via database constraints"

❌ "Handles all edge cases"
✅ "Handles common cases, with clear next steps for edge cases"
