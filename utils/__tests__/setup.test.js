import { describe, it, expect } from 'vitest';

describe('Test Setup Verification', () => {
  it('should verify that vitest is working', () => {
    expect(true).toBe(true);
  });

  it('should verify that fast-check is available', async () => {
    const fc = await import('fast-check');
    expect(fc).toBeDefined();
    expect(typeof fc.integer).toBe('function');
  });
});