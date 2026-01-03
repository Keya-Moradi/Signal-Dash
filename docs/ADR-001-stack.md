# ADR-001 — Stack Choice

## Decision

Use Node.js + Express + EJS + Postgres.

## Rationale

- **EJS** avoids frontend build complexity
- **Express** is widely understood and easy to demo
- **Postgres** shows real SQL usage and analytics queries
- **Chart.js** via CDN keeps UI simple

## Alternatives Considered

- React/Vite dashboard (more complexity)
- ORM-heavy approach (less transparent SQL learning)
