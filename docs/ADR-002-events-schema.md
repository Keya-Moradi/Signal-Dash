# ADR-002 — Events Schema

## Decision

Store events as rows with:

- experiment_id
- variant_id
- user_key
- event_type
- occurred_at
- props (JSONB)

## Rationale

- Simple and extensible
- Supports basic analysis via SQL
- JSONB enables lightweight metadata without schema churn
