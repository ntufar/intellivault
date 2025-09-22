import { describe, it, expect } from 'vitest';

describe('CLI search', () => {
  it('returns top-k results as JSON', async () => {
    const cli = await import('../../src/cli/index');
    expect(cli).toHaveProperty('run');
    const output = await cli.run(['search', '--q', 'test', '--k', '10', '--tenant', 't1']);
    const parsed = JSON.parse(typeof output === 'string' ? output : '');
    expect(parsed).toHaveProperty('results');
    expect(Array.isArray(parsed.results)).toBe(true);
  });
});


