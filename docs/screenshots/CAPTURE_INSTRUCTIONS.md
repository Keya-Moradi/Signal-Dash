# Screenshot Capture Instructions

Follow these steps to capture professional screenshots for the README.

## Prerequisites

1. Make sure Docker is running
2. Database is seeded with demo data
3. App is running on http://localhost:3000

## Quick Setup

```bash
# From project root
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev
```

## Capture Sequence

### 1. Dashboard Screenshot

- **URL**: http://localhost:3000/
- **What to show**: Experiment list with status badges, SLA indicators
- **Save as**: `docs/screenshots/dashboard.png`
- **Tips**:
  - Zoom browser to 100%
  - Recommended width: 1200-1400px
  - Crop to show just the dashboard table (exclude browser chrome)
  - Should show experiments in different states (Draft, Running, Readout)

### 2. Experiment Detail Screenshot

- **URL**: Click on "Checkout Flow Optimization Test" (the experiment with clear winner)
- **What to show**: Variant comparison table, Chart.js visualization, stats analysis
- **Save as**: `docs/screenshots/experiment-detail.png`
- **Tips**:
  - Capture the full experiment detail view
  - Make sure the chart is visible
  - Should show conversion rates, lift, p-value, confidence interval
  - Include the warnings section if present

### 3. Readout Screenshot

- **URL**: From experiment detail, click "View Readout" or "Generate Readout"
- **What to show**: AI-generated readout summary, decision form, cached timestamp
- **Save as**: `docs/screenshots/readout.png`
- **Tips**:
  - Make sure "Source: openai" or "Source: fallback" is visible
  - Show the cached readout timestamp
  - Include the decision form (Ship/Kill/Iterate)
  - Capture the full readout content

## Screenshot Tool Recommendations

- **macOS**: Cmd+Shift+4, then Space to capture window, or drag to select area
- **Windows**: Snipping Tool or Win+Shift+S
- **Cross-platform**: Browser DevTools device toolbar for consistent sizing

## Verification

After capturing, verify:
- [ ] All three files exist in `docs/screenshots/`
- [ ] Images are PNG format
- [ ] File sizes are reasonable (< 500KB each)
- [ ] Images show meaningful data (not empty tables)
- [ ] README renders images correctly when viewing locally

## GitHub Preview

To preview how images will look on GitHub:
```bash
# Push to GitHub and view README
git add docs/screenshots/*.png
git commit -m "Add screenshots"
git push
```

Then view your repo on GitHub to verify images render correctly.
