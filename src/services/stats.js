// Statistical functions for A/B testing

/**
 * Standard normal cumulative distribution function (CDF)
 * Approximation using polynomial approximation
 */
function normalCDF(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

/**
 * Calculate 2-proportion z-test
 * Returns { z, pValue }
 */
function twoProportionZTest(conv1, exp1, conv2, exp2) {
  const p1 = conv1 / exp1;
  const p2 = conv2 / exp2;

  // Pooled proportion
  const pooledP = (conv1 + conv2) / (exp1 + exp2);

  // Standard error
  const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / exp1 + 1 / exp2));

  // Z-score
  const z = (p2 - p1) / se;

  // Two-tailed p-value
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));

  return { z, pValue };
}

/**
 * Calculate 95% confidence interval for difference in proportions
 * Returns { lower, upper }
 */
function confidenceInterval(conv1, exp1, conv2, exp2) {
  const p1 = conv1 / exp1;
  const p2 = conv2 / exp2;

  const diff = p2 - p1;

  // Standard error for difference
  const seDiff = Math.sqrt((p1 * (1 - p1)) / exp1 + (p2 * (1 - p2)) / exp2);

  // 95% CI uses z = 1.96
  const margin = 1.96 * seDiff;

  return {
    lower: diff - margin,
    upper: diff + margin,
  };
}

/**
 * Calculate lift percentage
 * Returns null when lift is undefined (control rate is 0 but variant rate is not)
 */
function calculateLift(controlRate, variantRate) {
  // Both zero = no change
  if (controlRate === 0 && variantRate === 0) return 0;

  // Control is 0 but variant is not = lift undefined
  if (controlRate === 0 && variantRate > 0) return null;

  return ((variantRate - controlRate) / controlRate) * 100;
}

/**
 * Analyze experiment results
 * Returns full stats object with warnings
 */
export function analyzeExperiment(controlData, variantData) {
  const controlExposures = controlData.exposures;
  const controlConversions = controlData.conversions;
  const variantExposures = variantData.exposures;
  const variantConversions = variantData.conversions;

  const controlRate = controlExposures > 0 ? controlConversions / controlExposures : 0;
  const variantRate = variantExposures > 0 ? variantConversions / variantExposures : 0;

  const lift = calculateLift(controlRate, variantRate);

  const warnings = [];

  // Check for missing data
  if (controlExposures === 0 || variantExposures === 0) {
    warnings.push('Missing exposure data in one or both variants');
  }

  // Check for small sample size
  if (controlExposures < 100 || variantExposures < 100) {
    warnings.push('Small sample size detected (< 100 exposures per variant)');
  }

  // Check for imbalance (only if both have data)
  if (controlExposures > 0 && variantExposures > 0) {
    const minExposures = Math.min(controlExposures, variantExposures);
    if (minExposures > 0) {
      const imbalanceRatio = Math.max(controlExposures, variantExposures) / minExposures;
      if (imbalanceRatio > 1.5) {
        warnings.push('Possible sample imbalance between variants');
      }
    }
  }

  // Check for undefined lift
  if (lift === null) {
    warnings.push('Lift undefined (control conversion rate is 0)');
  }

  // Calculate z-test and CI only if we have enough data
  let zTest = null;
  let ci = null;
  let isSignificant = false;

  if (controlExposures > 0 && variantExposures > 0) {
    zTest = twoProportionZTest(
      controlConversions,
      controlExposures,
      variantConversions,
      variantExposures
    );

    ci = confidenceInterval(
      controlConversions,
      controlExposures,
      variantConversions,
      variantExposures
    );

    // Typically use p < 0.05 for significance
    isSignificant = zTest.pValue < 0.05;
  }

  return {
    control: {
      exposures: controlExposures,
      conversions: controlConversions,
      conversionRate: controlRate,
    },
    variant: {
      exposures: variantExposures,
      conversions: variantConversions,
      conversionRate: variantRate,
    },
    lift: lift,
    zScore: zTest?.z || null,
    pValue: zTest?.pValue || null,
    confidenceInterval: ci,
    isSignificant,
    warnings,
  };
}

export default {
  analyzeExperiment,
  twoProportionZTest,
  confidenceInterval,
  calculateLift,
  normalCDF,
};
