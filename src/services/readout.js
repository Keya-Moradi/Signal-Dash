import config from '../config.js';

/**
 * Generate a deterministic fallback summary
 */
function generateFallbackSummary(stats, experimentName) {
  const { control, variant, lift, isSignificant, pValue, warnings } = stats;

  // Handle lift edge cases
  let liftDescription;
  if (lift === null) {
    liftDescription = 'undefined (control conversion rate is 0)';
  } else if (lift === 0) {
    liftDescription = '0% (no change)';
  } else {
    const liftDirection = lift > 0 ? 'increased' : 'decreased';
    const liftMagnitude = Math.abs(lift).toFixed(2);
    liftDescription = `${liftMagnitude}% ${liftDirection}`;
  }

  let summary = `## Summary\n\n`;
  summary += `The experiment "${experimentName}" tested a variant against the control.\n\n`;
  summary += `- **Control conversion rate**: ${(control.conversionRate * 100).toFixed(2)}% (${control.conversions}/${control.exposures})\n`;
  summary += `- **Variant conversion rate**: ${(variant.conversionRate * 100).toFixed(2)}% (${variant.conversions}/${variant.exposures})\n`;
  summary += `- **Lift**: ${liftDescription}\n`;
  summary += `- **Statistical significance**: ${isSignificant ? 'Yes (p < 0.05)' : 'No'}\n`;
  if (pValue !== null) {
    summary += `- **P-value**: ${pValue.toFixed(4)}\n`;
  }

  summary += `\n## Decision Recommendation\n\n`;

  // Decision logic
  if (warnings.some((w) => w.includes('Missing exposure'))) {
    summary += `**Iterate**: Missing exposure data in one or both variants. Cannot make a decision without data.\n`;
  } else if (lift === null) {
    summary += `**Iterate**: Lift is undefined because control conversion rate is 0. Collect more data or investigate why control has no conversions.\n`;
  } else if (warnings.some((w) => w.includes('Small sample'))) {
    summary += `**Iterate**: Sample size is too small to make a confident decision. Continue collecting data until each variant has at least 100 exposures.\n`;
  } else if (isSignificant && lift > 0) {
    summary += `**Ship**: The variant shows a statistically significant improvement of ${Math.abs(lift).toFixed(2)}%. Recommend rolling out to all users.\n`;
  } else if (isSignificant && lift < 0) {
    summary += `**Kill**: The variant shows a statistically significant decrease of ${Math.abs(lift).toFixed(2)}%. Do not ship this change.\n`;
  } else if (!isSignificant && lift > 0) {
    summary += `**Iterate**: The variant shows a directional improvement but is not statistically significant. Consider running longer or increasing sample size.\n`;
  } else {
    summary += `**Kill**: No meaningful improvement detected. Do not ship this change.\n`;
  }

  summary += `\n## Risks / Caveats\n\n`;
  if (warnings.length > 0) {
    warnings.forEach((w) => {
      summary += `- ${w}\n`;
    });
  } else {
    summary += `- This analysis uses a 2-proportion z-test, which is an approximation that works best with larger sample sizes.\n`;
    summary += `- Statistical significance does not guarantee practical significance. Consider business impact.\n`;
  }

  summary += `\n## Next Test Suggestion\n\n`;
  if (isSignificant && lift > 0) {
    summary += `Test a more aggressive version of this change to see if you can capture even more lift.\n`;
  } else if (!isSignificant && lift > 0) {
    summary += `Run this test longer or with a larger sample size to confirm the directional trend.\n`;
  } else {
    summary += `Try a different hypothesis or test a completely different area of the product.\n`;
  }

  return summary;
}

/**
 * Call OpenAI API to generate readout
 */
async function callOpenAI(stats, experimentName, hypothesis) {
  const apiKey = config.openaiApiKey;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `You are an experiment analyst. Write a short experiment readout for stakeholders.

Experiment: ${experimentName}
Hypothesis: ${hypothesis}

Results:
- Control: ${stats.control.conversions}/${stats.control.exposures} conversions (${(stats.control.conversionRate * 100).toFixed(2)}%)
- Variant: ${stats.variant.conversions}/${stats.variant.exposures} conversions (${(stats.variant.conversionRate * 100).toFixed(2)}%)
- Lift: ${stats.lift.toFixed(2)}%
- P-value: ${stats.pValue?.toFixed(4) || 'N/A'}
- Statistically significant: ${stats.isSignificant ? 'Yes' : 'No'}
- Warnings: ${stats.warnings.join(', ') || 'None'}

Write a readout with these sections:
1. Summary (what changed)
2. Decision recommendation (Ship / Kill / Iterate with reason)
3. Risks / caveats (be blunt if sample size is too small)
4. Next test suggestion (1 idea)

Be concise and actionable.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Call Anthropic API to generate readout
 */
async function callAnthropic(stats, experimentName, hypothesis) {
  const apiKey = config.anthropicApiKey;
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const prompt = `You are an experiment analyst. Write a short experiment readout for stakeholders.

Experiment: ${experimentName}
Hypothesis: ${hypothesis}

Results:
- Control: ${stats.control.conversions}/${stats.control.exposures} conversions (${(stats.control.conversionRate * 100).toFixed(2)}%)
- Variant: ${stats.variant.conversions}/${stats.variant.exposures} conversions (${(stats.variant.conversionRate * 100).toFixed(2)}%)
- Lift: ${stats.lift.toFixed(2)}%
- P-value: ${stats.pValue?.toFixed(4) || 'N/A'}
- Statistically significant: ${stats.isSignificant ? 'Yes' : 'No'}
- Warnings: ${stats.warnings.join(', ') || 'None'}

Write a readout with these sections:
1. Summary (what changed)
2. Decision recommendation (Ship / Kill / Iterate with reason)
3. Risks / caveats (be blunt if sample size is too small)
4. Next test suggestion (1 idea)

Be concise and actionable.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

/**
 * Generate readout using AI if available, otherwise use fallback
 */
export async function generateReadout(stats, experimentName, hypothesis) {
  const provider = config.llmProvider;

  try {
    if (provider === 'openai' && config.openaiApiKey) {
      console.log('Using OpenAI for readout generation');
      const aiSummary = await callOpenAI(stats, experimentName, hypothesis);
      return {
        summary: aiSummary,
        source: 'openai',
      };
    } else if (provider === 'anthropic' && config.anthropicApiKey) {
      console.log('Using Anthropic for readout generation');
      const aiSummary = await callAnthropic(stats, experimentName, hypothesis);
      return {
        summary: aiSummary,
        source: 'anthropic',
      };
    } else {
      console.log('Using fallback readout generation');
      const fallbackSummary = generateFallbackSummary(stats, experimentName);
      return {
        summary: fallbackSummary,
        source: 'fallback',
      };
    }
  } catch (error) {
    console.error('AI readout failed, using fallback:', error.message);
    const fallbackSummary = generateFallbackSummary(stats, experimentName);
    return {
      summary: fallbackSummary,
      source: 'fallback',
    };
  }
}

export default { generateReadout };
