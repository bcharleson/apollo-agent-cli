import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UserInputError, ApolloError, formatError } from '../../src/core/errors.js';
import { outputError } from '../../src/core/output.js';

let errs: string[];

beforeEach(() => {
  errs = [];
  vi.spyOn(console, 'error').mockImplementation((m: any) => {
    errs.push(typeof m === 'string' ? m : JSON.stringify(m));
  });
  process.exitCode = 0;
});

afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = 0;
});

describe('UserInputError', () => {
  it('extends ApolloError', () => {
    const e = new UserInputError('bad input');
    expect(e).toBeInstanceOf(ApolloError);
  });

  it('has code USER_INPUT_ERROR', () => {
    const e = new UserInputError('bad input');
    expect(e.code).toBe('USER_INPUT_ERROR');
  });

  it('formatError reports the code correctly', () => {
    const result = formatError(new UserInputError('bad'));
    expect(result.code).toBe('USER_INPUT_ERROR');
    expect(result.message).toBe('bad');
  });

  it('outputError serializes UserInputError as JSON with the code', () => {
    outputError(new UserInputError('--contact-ids must include at least one ID'));
    const parsed = JSON.parse(errs[0]);
    expect(parsed.code).toBe('USER_INPUT_ERROR');
    expect(parsed.error).toContain('--contact-ids');
    expect(process.exitCode).toBe(1);
  });

  it('outputError --pretty surfaces UserInputError as plain text', () => {
    outputError(new UserInputError('Missing required option(s): --account-id'), {
      output: 'pretty',
    });
    expect(errs[0]).toContain('Missing required option');
    expect(process.exitCode).toBe(1);
  });

  it('formatError distinguishes UserInputError from generic Error', () => {
    expect(formatError(new UserInputError('user error')).code).toBe('USER_INPUT_ERROR');
    expect(formatError(new Error('generic error')).code).toBe('UNKNOWN_ERROR');
  });
});
