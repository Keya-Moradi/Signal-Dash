import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  try {
    console.log('Starting seed...');

    // Clear existing data (for development)
    await pool.query('DELETE FROM events');
    await pool.query('DELETE FROM variants');
    await pool.query('DELETE FROM experiments');

    // Create Experiment 1: Button Color Test (significant positive result)
    const exp1 = await pool.query(
      `INSERT INTO experiments (name, hypothesis, primary_metric, status, owner, requested_at, started_at)
       VALUES ($1, $2, $3, $4, $5, NOW() - interval '10 days', NOW() - interval '7 days')
       RETURNING id`,
      [
        'Homepage CTA Button Color',
        'Changing the CTA button from blue to green will increase click-through rate',
        'conversion',
        'Running',
        'alice@example.com',
      ]
    );
    const exp1Id = exp1.rows[0].id;

    // Create variants for Experiment 1
    const exp1Control = await pool.query(
      `INSERT INTO variants (experiment_id, name, is_control) VALUES ($1, $2, $3) RETURNING id`,
      [exp1Id, 'Control (Blue)', true]
    );
    const exp1Variant = await pool.query(
      `INSERT INTO variants (experiment_id, name, is_control) VALUES ($1, $2, $3) RETURNING id`,
      [exp1Id, 'Variant (Green)', false]
    );

    const controlId1 = exp1Control.rows[0].id;
    const variantId1 = exp1Variant.rows[0].id;

    // Generate events for Experiment 1
    // Control: 1000 exposures, 120 conversions (12% conversion rate)
    // Variant: 1020 exposures, 153 conversions (15% conversion rate) - significant lift
    await generateEvents(exp1Id, controlId1, 1000, 120);
    await generateEvents(exp1Id, variantId1, 1020, 153);

    console.log(`✓ Created experiment: ${exp1Id} - Homepage CTA Button Color`);

    // Create Experiment 2: Email Subject Line (not significant)
    const exp2 = await pool.query(
      `INSERT INTO experiments (name, hypothesis, primary_metric, status, owner, requested_at, started_at)
       VALUES ($1, $2, $3, $4, $5, NOW() - interval '5 days', NOW() - interval '3 days')
       RETURNING id`,
      [
        'Welcome Email Subject Line',
        'Adding emoji to welcome email subject will increase open rate',
        'conversion',
        'Running',
        'bob@example.com',
      ]
    );
    const exp2Id = exp2.rows[0].id;

    const exp2Control = await pool.query(
      `INSERT INTO variants (experiment_id, name, is_control) VALUES ($1, $2, $3) RETURNING id`,
      [exp2Id, 'Control (No Emoji)', true]
    );
    const exp2Variant = await pool.query(
      `INSERT INTO variants (experiment_id, name, is_control) VALUES ($1, $2, $3) RETURNING id`,
      [exp2Id, 'Variant (With Emoji)', false]
    );

    const controlId2 = exp2Control.rows[0].id;
    const variantId2 = exp2Variant.rows[0].id;

    // Generate events for Experiment 2
    // Control: 850 exposures, 170 conversions (20% conversion rate)
    // Variant: 830 exposures, 174 conversions (20.96% conversion rate) - not significant
    await generateEvents(exp2Id, controlId2, 850, 170);
    await generateEvents(exp2Id, variantId2, 830, 174);

    console.log(`✓ Created experiment: ${exp2Id} - Welcome Email Subject Line`);

    // Create Experiment 3: Small sample (for warning demonstration)
    const exp3 = await pool.query(
      `INSERT INTO experiments (name, hypothesis, primary_metric, status, owner, requested_at)
       VALUES ($1, $2, $3, $4, $5, NOW() - interval '2 days')
       RETURNING id`,
      [
        'Pricing Page Layout',
        'Vertical pricing cards will increase conversions vs horizontal',
        'conversion',
        'Draft',
        'charlie@example.com',
      ]
    );
    const exp3Id = exp3.rows[0].id;

    const exp3Control = await pool.query(
      `INSERT INTO variants (experiment_id, name, is_control) VALUES ($1, $2, $3) RETURNING id`,
      [exp3Id, 'Control (Horizontal)', true]
    );
    const exp3Variant = await pool.query(
      `INSERT INTO variants (experiment_id, name, is_control) VALUES ($1, $2, $3) RETURNING id`,
      [exp3Id, 'Variant (Vertical)', false]
    );

    const controlId3 = exp3Control.rows[0].id;
    const variantId3 = exp3Variant.rows[0].id;

    // Generate small sample events for Experiment 3
    // Control: 45 exposures, 9 conversions
    // Variant: 52 exposures, 13 conversions
    await generateEvents(exp3Id, controlId3, 45, 9);
    await generateEvents(exp3Id, variantId3, 52, 13);

    console.log(`✓ Created experiment: ${exp3Id} - Pricing Page Layout`);

    console.log('✅ Seed completed successfully');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Helper function to generate synthetic events
async function generateEvents(experimentId, variantId, exposures, conversions) {
  // Generate exposure events
  for (let i = 0; i < exposures; i++) {
    await pool.query(
      `INSERT INTO events (experiment_id, variant_id, user_key, event_type, occurred_at, props)
       VALUES ($1, $2, $3, $4, NOW() - (random() * interval '5 days'), $5)`,
      [
        experimentId,
        variantId,
        `user_${experimentId}_${variantId}_${i}`,
        'exposure',
        JSON.stringify({ source: 'web' }),
      ]
    );
  }

  // Generate conversion events (subset of exposed users)
  for (let i = 0; i < conversions; i++) {
    await pool.query(
      `INSERT INTO events (experiment_id, variant_id, user_key, event_type, occurred_at, props)
       VALUES ($1, $2, $3, $4, NOW() - (random() * interval '5 days') + interval '1 hour', $5)`,
      [
        experimentId,
        variantId,
        `user_${experimentId}_${variantId}_${i}`,
        'conversion',
        JSON.stringify({ source: 'web' }),
      ]
    );
  }
}

seed();
