import express from 'express';
import { query } from '../db.js';
import { analyzeExperiment } from '../services/stats.js';
import { generateReadout } from '../services/readout.js';

const router = express.Router();

// List all experiments
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM experiments ORDER BY requested_at DESC'
    );
    res.render('index', { experiments: result.rows });
  } catch (error) {
    console.error('Error fetching experiments:', error);
    res.status(500).send('Error fetching experiments');
  }
});

// Show create experiment form
router.get('/new', (req, res) => {
  res.render('experiment_new');
});

// Create new experiment
router.post('/', async (req, res) => {
  const { name, hypothesis, primary_metric, owner, control_name, variant_name } = req.body;

  try {
    // Insert experiment
    const expResult = await query(
      `INSERT INTO experiments (name, hypothesis, primary_metric, owner)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [name, hypothesis, primary_metric, owner]
    );

    const experimentId = expResult.rows[0].id;

    // Insert control variant
    await query(
      `INSERT INTO variants (experiment_id, name, is_control) VALUES ($1, $2, $3)`,
      [experimentId, control_name, true]
    );

    // Insert test variant
    await query(
      `INSERT INTO variants (experiment_id, name, is_control) VALUES ($1, $2, $3)`,
      [experimentId, variant_name, false]
    );

    res.redirect(`/experiments/${experimentId}`);
  } catch (error) {
    console.error('Error creating experiment:', error);
    res.status(500).send('Error creating experiment');
  }
});

// Show experiment detail
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Get experiment
    const expResult = await query(
      'SELECT * FROM experiments WHERE id = $1',
      [id]
    );

    if (expResult.rows.length === 0) {
      return res.status(404).send('Experiment not found');
    }

    const experiment = expResult.rows[0];

    // Get variants with event counts in a single efficient query
    const statsResult = await query(
      `SELECT
        v.id AS variant_id,
        v.name AS variant_name,
        v.is_control,
        COUNT(DISTINCT CASE WHEN e.event_type = 'exposure' THEN e.user_key END) AS exposures,
        COUNT(DISTINCT CASE WHEN e.event_type = 'conversion' THEN e.user_key END) AS conversions
      FROM variants v
      LEFT JOIN events e
        ON e.variant_id = v.id
        AND e.experiment_id = v.experiment_id
      WHERE v.experiment_id = $1
      GROUP BY v.id, v.name, v.is_control
      ORDER BY v.is_control DESC, v.id ASC`,
      [id]
    );

    const variants = statsResult.rows.map(row => ({
      id: row.variant_id,
      name: row.variant_name,
      is_control: row.is_control,
      exposures: parseInt(row.exposures),
      conversions: parseInt(row.conversions),
    }));

    // Calculate stats if we have 2 variants
    let stats = null;
    if (variants.length === 2) {
      const control = variants.find((v) => v.is_control);
      const variant = variants.find((v) => !v.is_control);

      if (control && variant) {
        stats = analyzeExperiment(
          {
            exposures: control.exposures,
            conversions: control.conversions,
          },
          {
            exposures: variant.exposures,
            conversions: variant.conversions,
          }
        );
      }
    }

    res.render('experiment_detail', { experiment, variants, stats });
  } catch (error) {
    console.error('Error fetching experiment:', error);
    res.status(500).send('Error fetching experiment');
  }
});

// Update experiment status
router.post('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // Update timestamps based on status
    let updateQuery = 'UPDATE experiments SET status = $1';
    const params = [status, id];

    if (status === 'Review' || status === 'Running') {
      updateQuery += ', approved_at = COALESCE(approved_at, NOW())';
    }

    if (status === 'Running') {
      updateQuery += ', started_at = COALESCE(started_at, NOW())';
    }

    if (status === 'Readout' || status === 'Shipped' || status === 'Killed') {
      updateQuery += ', ended_at = COALESCE(ended_at, NOW())';
    }

    updateQuery += ' WHERE id = $2';

    await query(updateQuery, params);
    res.redirect(`/experiments/${id}`);
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).send('Error updating status');
  }
});

// Show readout page
router.get('/:id/readout', async (req, res) => {
  const { id } = req.params;
  const { regenerate } = req.query;

  try {
    // Get experiment
    const expResult = await query(
      'SELECT * FROM experiments WHERE id = $1',
      [id]
    );

    if (expResult.rows.length === 0) {
      return res.status(404).send('Experiment not found');
    }

    const experiment = expResult.rows[0];

    // Check if we have a cached readout and don't need to regenerate
    if (
      !regenerate &&
      experiment.readout_text &&
      experiment.readout_source &&
      experiment.readout_generated_at
    ) {
      console.log('Using cached readout');
      const readout = {
        summary: experiment.readout_text,
        source: experiment.readout_source,
      };
      return res.render('experiment_readout', { experiment, readout });
    }

    // Get variants with event counts in a single efficient query
    const statsResult = await query(
      `SELECT
        v.id AS variant_id,
        v.name AS variant_name,
        v.is_control,
        COUNT(DISTINCT CASE WHEN e.event_type = 'exposure' THEN e.user_key END) AS exposures,
        COUNT(DISTINCT CASE WHEN e.event_type = 'conversion' THEN e.user_key END) AS conversions
      FROM variants v
      LEFT JOIN events e
        ON e.variant_id = v.id
        AND e.experiment_id = v.experiment_id
      WHERE v.experiment_id = $1
      GROUP BY v.id, v.name, v.is_control
      ORDER BY v.is_control DESC, v.id ASC`,
      [id]
    );

    const variants = statsResult.rows.map(row => ({
      id: row.variant_id,
      name: row.variant_name,
      is_control: row.is_control,
      exposures: parseInt(row.exposures),
      conversions: parseInt(row.conversions),
    }));

    // Calculate stats
    const control = variants.find((v) => v.is_control);
    const variant = variants.find((v) => !v.is_control);

    if (!control || !variant) {
      return res.status(400).send('Experiment must have control and variant');
    }

    const stats = analyzeExperiment(
      {
        exposures: control.exposures,
        conversions: control.conversions,
      },
      {
        exposures: variant.exposures,
        conversions: variant.conversions,
      }
    );

    // Generate readout with timeout protection
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Readout generation timeout')), 30000)
    );

    const readout = await Promise.race([
      generateReadout(stats, experiment.name, experiment.hypothesis),
      timeoutPromise,
    ]);

    // Cache the readout in the database
    await query(
      `UPDATE experiments
       SET readout_text = $1, readout_source = $2, readout_generated_at = NOW()
       WHERE id = $3`,
      [readout.summary, readout.source, id]
    );

    res.render('experiment_readout', { experiment, readout });
  } catch (error) {
    console.error('Error generating readout:', error);
    res.status(500).send('Error generating readout');
  }
});

// Save decision
router.post('/:id/decision', async (req, res) => {
  const { id } = req.params;
  const { decision, notes } = req.body;

  try {
    await query(
      'UPDATE experiments SET decision = $1, notes = $2, status = $3 WHERE id = $4',
      [decision, notes, decision === 'Ship' ? 'Shipped' : decision === 'Kill' ? 'Killed' : 'Readout', id]
    );

    res.redirect(`/experiments/${id}`);
  } catch (error) {
    console.error('Error saving decision:', error);
    res.status(500).send('Error saving decision');
  }
});

export default router;
