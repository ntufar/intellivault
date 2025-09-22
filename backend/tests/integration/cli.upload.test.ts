import { describe, it, expect } from 'vitest';

describe('CLI upload', () => {
  it('uploads documents and returns JSON summary', async () => {
    const cli = await import('../../src/cli/index');
    expect(cli).toHaveProperty('run');
    const output = await cli.run(['upload', '--path', './samples', '--tenant', 't1']);
    const parsed = JSON.parse(typeof output === 'string' ? output : '');
    expect(parsed).toHaveProperty('uploaded');
    expect(Array.isArray(parsed.uploaded)).toBe(true);
  });
});


