import { beforeAll, afterAll } from '@jest/globals';
import fetch from 'node-fetch';
import FormData from 'form-data';

// Assign these to global scope for tests
globalThis.fetch = fetch as any;
globalThis.FormData = FormData as any;

// Add any global test setup here
beforeAll(() => {
  // Setup test environment
});

afterAll(() => {
  // Cleanup test environment
});