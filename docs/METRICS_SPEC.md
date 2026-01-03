# Metrics Spec — Signal Dash

## Event Types

- **exposure**: user is exposed to a variant
- **conversion**: user completes the desired action

## Primary Metric (MVP)

**conversion_rate** = conversions / exposures

## Definitions

- **exposures**: count of exposure events
- **conversions**: count of conversion events
- **conversion_rate**: conversions / exposures

## Guardrails / Warnings

- If exposures < 100 for any variant, display "Small sample" warning
- If exposure counts differ massively between variants, display "Possible imbalance" warning
