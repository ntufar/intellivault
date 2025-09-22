import { describe, it, expect } from 'vitest';

describe('CLI summarize', () => {
  it('summarizes a document and returns JSON', async () => {
    const cli = await import('../../src/cli/index');
    expect(cli).toHaveProperty('run');
    const output = await cli.run(['summarize', '--doc-id', 'doc_123']);
    const parsed = JSON.parse(typeof output === 'string' ? output : '');
    expect(parsed).toHaveProperty('summary');
  });
});


