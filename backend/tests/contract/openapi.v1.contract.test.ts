import { describe, it, expect } from 'vitest';
import SwaggerParser from 'swagger-parser';
import path from 'node:path';

describe('OpenAPI v1 Contract', () => {
  const openapiPath = path.resolve(
    process.cwd(),
    '..',
    'specs/001-intellivault-ai-powered/contracts/openapi.yaml',
  );

  it('validates the OpenAPI schema', async () => {
    const api = (await SwaggerParser.validate(openapiPath)) as any;
    expect(api && (api.openapi || api.swagger)).toBeDefined();
  });

  it('defines required endpoints and methods', async () => {
    const api = (await SwaggerParser.dereference(openapiPath)) as any;
    const paths = api.paths || {};

    // Required endpoints
    expect(paths['/v1/documents']).toBeDefined();
    expect(paths['/v1/search']).toBeDefined();
    expect(paths['/v1/qa']).toBeDefined();

    // Methods and basic shapes present
    expect(paths['/v1/documents'].get).toBeDefined();
    expect(paths['/v1/documents'].post).toBeDefined();
    expect(paths['/v1/search'].get).toBeDefined();
    expect(paths['/v1/qa'].post).toBeDefined();
  });

  it('has corresponding zod schemas implemented (request/response)', async () => {
    const modPath = path.resolve(process.cwd(), 'src/api/validation/schemas.ts');
    const schemas = await import(modPath);
    expect(schemas).toHaveProperty('ListDocumentsResponseSchema');
    expect(schemas).toHaveProperty('UploadDocumentRequestSchema');
    expect(schemas).toHaveProperty('UploadDocumentResponseSchema');
    expect(schemas).toHaveProperty('SearchRequestQuerySchema');
    expect(schemas).toHaveProperty('SearchResponseSchema');
    expect(schemas).toHaveProperty('QARequestBodySchema');
    expect(schemas).toHaveProperty('QAResponseSchema');
  });
});


