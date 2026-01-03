import express from 'express';
import { z } from 'zod';
import { query } from '../db.js';

const router = express.Router();

// Validation schema for tracking events
const trackEventSchema = z.object({
  experimentId: z.number().int().positive(),
  variantId: z.number().int().positive(),
  userKey: z.string().min(1),
  eventType: z.enum(['exposure', 'conversion']),
  props: z.record(z.any()).optional().default({}),
});

// Track event endpoint
router.post('/', async (req, res) => {
  try {
    // Validate request body
    const validatedData = trackEventSchema.parse(req.body);

    const { experimentId, variantId, userKey, eventType, props } = validatedData;

    // Verify variant belongs to experiment (data integrity)
    const variantCheck = await query(
      `SELECT 1 FROM variants WHERE id = $1 AND experiment_id = $2`,
      [variantId, experimentId]
    );

    if (variantCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Variant does not belong to the specified experiment',
      });
    }

    // Insert event with ON CONFLICT for real deduplication
    // The unique index on (experiment_id, user_key, event_type) prevents duplicates
    const result = await query(
      `INSERT INTO events (experiment_id, variant_id, user_key, event_type, props)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (experiment_id, user_key, event_type)
       DO NOTHING
       RETURNING id, occurred_at`,
      [experimentId, variantId, userKey, eventType, props]
    );

    // If RETURNING gives no rows, it was a duplicate
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        message: 'Event already recorded',
        duplicate: true,
      });
    }

    res.json({
      success: true,
      message: 'Event tracked successfully',
      eventId: result.rows[0].id,
      occurredAt: result.rows[0].occurred_at,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }

    console.error('Error tracking event:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;
