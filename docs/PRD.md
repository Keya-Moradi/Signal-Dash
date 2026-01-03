# PRD — Signal Dash (ExperimentOps Lite)

## Problem

Experimentation is often messy: requests happen in Slack, ownership is unclear, and results are hard to communicate quickly.

## Goal

Provide a simple system to:

- Intake experiments
- Track status and ownership
- Capture exposures/conversions
- Compute and visualize results
- Produce a short readout + decision

## Users

- TPM / PM running experiments
- Engineers or analysts who want quick results

## Success Criteria (MVP)

- Can create an experiment with 2 variants
- Can log exposure/conversion events via API
- Can see conversion + lift + significance on dashboard
- Can generate a readout (fallback works without AI keys)

## Scope (MVP)

- Experiments, variants, events
- Status workflow
- Basic stats + chart
- Readout page

## Non-Goals

- Full randomization/assignment engine
- Multi-metric funnel analysis
- Advanced Bayesian stats
- Enterprise auth
