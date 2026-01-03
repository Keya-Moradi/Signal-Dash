# Experiment SOP — Signal Dash

## Workflow States

- **Draft** — created, not reviewed
- **Review** — awaiting approval
- **Running** — collecting events
- **Readout** — analysis ready
- **Shipped** — change adopted
- **Killed** — change rejected

## Intake Requirements

- Hypothesis
- Primary metric
- Variants
- Owner
- Start/end plan

## Decision Rules (MVP guidance)

- If sample size is small, default to **Iterate** (collect more data)
- If lift is negative and significant, recommend **Kill**
- If lift is positive and significant, recommend **Ship**
- If not significant but directionally positive, recommend **Iterate** with next test idea
