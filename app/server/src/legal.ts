/**
 * Must stay in step with client/src/legal/documents.ts. The server is the
 * authority on what a user actually accepted, so consent is validated here
 * rather than trusted from the client.
 */
export const LEGAL_VERSIONS = {
  terms: '2026-08-26',
  privacy: '2026-08-26',
} as const;

export const MINIMUM_AGE = 16;
