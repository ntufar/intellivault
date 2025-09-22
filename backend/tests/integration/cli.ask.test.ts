import { describe, it, expect } from 'vitest';

describe('CLI ask', () => {
  it('answers a question with sources as JSON', async () => {
    const cli = await import('../../src/cli/index');
    expect(cli).toHaveProperty('run');
    const output = await cli.run(['ask', '--q', 'What is IntelliVault?', '--tenant', 't1', '--with-sources']);
    const parsed = JSON.parse(typeof output === 'string' ? output : '');
    expect(parsed).toHaveProperty('answer');
    expect(parsed).toHaveProperty('sources');
    expect(Array.isArray(parsed.sources)).toBe(true);
  });
});


