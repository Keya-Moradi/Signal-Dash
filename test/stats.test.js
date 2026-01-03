import { describe, test, expect } from '@jest/globals';
import stats from '../src/services/stats.js';

const { analyzeExperiment, twoProportionZTest, confidenceInterval, calculateLift, normalCDF } = stats;

describe('Stats Service', () => {
  describe('normalCDF', () => {
    test('should return ~0.5 for z=0', () => {
      const result = normalCDF(0);
      expect(result).toBeCloseTo(0.5, 2);
    });

    test('should return high value for positive z', () => {
      const result = normalCDF(1.96);
      expect(result).toBeGreaterThan(0.97);
    });

    test('should return low value for negative z', () => {
      const result = normalCDF(-1.96);
      expect(result).toBeLessThan(0.03);
    });
  });

  describe('calculateLift', () => {
    test('should calculate positive lift correctly', () => {
      const lift = calculateLift(0.10, 0.15);
      expect(lift).toBeCloseTo(50, 1);
    });

    test('should calculate negative lift correctly', () => {
      const lift = calculateLift(0.15, 0.10);
      expect(lift).toBeCloseTo(-33.33, 1);
    });

    test('should return null when control rate is 0 but variant is not', () => {
      const lift = calculateLift(0, 0.10);
      expect(lift).toBe(null);
    });

    test('should return 0 when both rates are 0', () => {
      const lift = calculateLift(0, 0);
      expect(lift).toBe(0);
    });

    test('should return 0 when both rates are equal', () => {
      const lift = calculateLift(0.10, 0.10);
      expect(lift).toBeCloseTo(0, 1);
    });
  });

  describe('twoProportionZTest', () => {
    test('should calculate z-test for significantly different proportions', () => {
      // Control: 100/1000 = 10%
      // Variant: 150/1000 = 15%
      const result = twoProportionZTest(100, 1000, 150, 1000);

      expect(result.z).toBeDefined();
      expect(result.pValue).toBeDefined();
      expect(result.pValue).toBeLessThan(0.05); // Should be significant
      expect(Math.abs(result.z)).toBeGreaterThan(1.96); // |z| > 1.96 for p < 0.05
    });

    test('should calculate z-test for similar proportions', () => {
      // Control: 100/1000 = 10%
      // Variant: 105/1000 = 10.5%
      const result = twoProportionZTest(100, 1000, 105, 1000);

      expect(result.pValue).toBeGreaterThan(0.05); // Should not be significant
    });
  });

  describe('confidenceInterval', () => {
    test('should calculate 95% CI for difference in proportions', () => {
      // Control: 100/1000 = 10%
      // Variant: 150/1000 = 15%
      // Difference: 5 percentage points
      const result = confidenceInterval(100, 1000, 150, 1000);

      expect(result.lower).toBeDefined();
      expect(result.upper).toBeDefined();
      expect(result.lower).toBeLessThan(result.upper);
      expect(result.lower).toBeCloseTo(0.05, 1); // Around 5% difference
    });

    test('CI should contain zero for non-significant difference', () => {
      // Small sample, small difference
      const result = confidenceInterval(10, 100, 12, 100);

      expect(result.lower).toBeLessThan(0);
      expect(result.upper).toBeGreaterThan(0);
    });
  });

  describe('analyzeExperiment', () => {
    test('should analyze experiment with significant positive result', () => {
      const controlData = { exposures: 1000, conversions: 120 };
      const variantData = { exposures: 1020, conversions: 153 };

      const result = analyzeExperiment(controlData, variantData);

      expect(result.control.conversionRate).toBeCloseTo(0.12, 2);
      expect(result.variant.conversionRate).toBeCloseTo(0.15, 2);
      expect(result.lift).toBeGreaterThan(0);
      expect(result.isSignificant).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    test('should warn about small sample size', () => {
      const controlData = { exposures: 50, conversions: 10 };
      const variantData = { exposures: 50, conversions: 15 };

      const result = analyzeExperiment(controlData, variantData);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Small sample');
    });

    test('should warn about sample imbalance', () => {
      const controlData = { exposures: 1000, conversions: 100 };
      const variantData = { exposures: 200, conversions: 20 };

      const result = analyzeExperiment(controlData, variantData);

      expect(result.warnings).toContain('Possible sample imbalance between variants');
    });

    test('should handle zero conversions', () => {
      const controlData = { exposures: 100, conversions: 0 };
      const variantData = { exposures: 100, conversions: 0 };

      const result = analyzeExperiment(controlData, variantData);

      expect(result.control.conversionRate).toBe(0);
      expect(result.variant.conversionRate).toBe(0);
      expect(result.lift).toBe(0);
    });

    test('should handle negative lift', () => {
      const controlData = { exposures: 1000, conversions: 150 };
      const variantData = { exposures: 1000, conversions: 100 };

      const result = analyzeExperiment(controlData, variantData);

      expect(result.lift).toBeLessThan(0);
    });
  });
});
