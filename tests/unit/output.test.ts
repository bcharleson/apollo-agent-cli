import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { output, outputError } from '../../src/core/output.js';

let logs: string[];
let errs: string[];

beforeEach(() => {
  logs = [];
  errs = [];
  vi.spyOn(console, 'log').mockImplementation((m: any) => {
    logs.push(typeof m === 'string' ? m : JSON.stringify(m));
  });
  vi.spyOn(console, 'error').mockImplementation((m: any) => {
    errs.push(typeof m === 'string' ? m : JSON.stringify(m));
  });
  process.exitCode = 0;
});

afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = 0;
});

describe('output()', () => {
  it('default outputs compact JSON', () => {
    output({ a: 1, b: 2 });
    expect(logs[0]).toBe('{"a":1,"b":2}');
  });

  it('--pretty outputs indented JSON', () => {
    output({ a: 1 }, { output: 'pretty' });
    expect(logs[0]).toContain('\n  ');
  });

  it('--quiet suppresses all output', () => {
    output({ a: 1 }, { quiet: true });
    expect(logs).toEqual([]);
  });

  it('--fields filters object keys', () => {
    output({ a: 1, b: 2, c: 3 }, { fields: 'a,c' });
    expect(JSON.parse(logs[0])).toEqual({ a: 1, c: 3 });
  });

  it('--fields filters array of objects', () => {
    output(
      [
        { id: 1, name: 'a', extra: 'x' },
        { id: 2, name: 'b', extra: 'y' },
      ],
      { fields: 'id,name' },
    );
    expect(JSON.parse(logs[0])).toEqual([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ]);
  });

  it('--fields unwraps Apollo list envelopes (contacts)', () => {
    output(
      { contacts: [{ id: '1', email: 'a@x.com', secret: '?' }], pagination_info: {} },
      { fields: 'id,email' },
    );
    expect(JSON.parse(logs[0])).toEqual([{ id: '1', email: 'a@x.com' }]);
  });

  it('--fields unwraps Apollo list envelopes (people)', () => {
    output(
      { people: [{ id: '1', name: 'A' }, { id: '2', name: 'B' }] },
      { fields: 'id,name' },
    );
    expect(JSON.parse(logs[0])).toEqual([
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
    ]);
  });

  it('--output table renders header + rows for an array', () => {
    output(
      [
        { id: '1', email: 'a@x.com' },
        { id: '2', email: 'b@x.com' },
      ],
      { output: 'table' },
    );
    expect(logs[0]).toContain('id');
    expect(logs[0]).toContain('email');
    expect(logs[0]).toContain('a@x.com');
    expect(logs[0]).toContain('b@x.com');
  });

  it('--output table unwraps Apollo list envelope', () => {
    output(
      { contacts: [{ id: '1', email: 'a@x.com' }] },
      { output: 'table' },
    );
    expect(logs[0]).toContain('a@x.com');
  });

  it('--output table renders single object as key/value', () => {
    output({ key1: 'v1', key2: 'v2' }, { output: 'table' });
    expect(logs[0]).toContain('key1');
    expect(logs[0]).toContain('v1');
  });

  it('--output table truncates large nested values', () => {
    const big = 'x'.repeat(200);
    output([{ field: { nested: big } }], { output: 'table' });
    expect(logs[0]).toContain('...');
  });
});

describe('outputError()', () => {
  it('writes JSON error to stderr by default', () => {
    outputError(new Error('boom'));
    const parsed = JSON.parse(errs[0]);
    expect(parsed.error).toBe('boom');
    expect(parsed.code).toBe('UNKNOWN_ERROR');
    expect(process.exitCode).toBe(1);
  });

  it('writes plain text error to stderr with --pretty', () => {
    outputError(new Error('boom'), { output: 'pretty' });
    expect(errs[0]).toBe('Error: boom');
    expect(process.exitCode).toBe(1);
  });

  it('--quiet suppresses error output but still sets exit code 1', () => {
    outputError(new Error('boom'), { quiet: true });
    expect(errs).toEqual([]);
    expect(process.exitCode).toBe(1);
  });
});
