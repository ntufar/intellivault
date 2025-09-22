import { describe, it, expect } from 'vitest';

describe('CLI up', () => {
  it('starts services and prints JSON status', async () => {
    // Intentionally failing until CLI is implemented
    const result = await import('../../src/cli/index');
    expect(result).toHaveProperty('run');
    const output = await result.run(['up']);
    const parsed = JSON.parse(typeof output === 'string' ? output : '');
    expect(parsed).toHaveProperty('services');
    expect(parsed).toHaveProperty('status');
  });
});


