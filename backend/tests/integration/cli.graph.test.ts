import { describe, it, expect } from 'vitest';

describe('CLI graph', () => {
  it('returns graph nodes and edges as JSON', async () => {
    const cli = await import('../../src/cli/index');
    expect(cli).toHaveProperty('run');
    const output = await cli.run(['graph', '--entity', 'Acme Corp']);
    const parsed = JSON.parse(typeof output === 'string' ? output : '');
    expect(parsed).toHaveProperty('nodes');
    expect(parsed).toHaveProperty('edges');
    expect(Array.isArray(parsed.nodes)).toBe(true);
    expect(Array.isArray(parsed.edges)).toBe(true);
  });
});


