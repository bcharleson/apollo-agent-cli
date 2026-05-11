import type { GlobalOptions } from './types.js';
import { formatError } from './errors.js';

const APOLLO_LIST_KEYS = [
  'contacts',
  'accounts',
  'people',
  'organizations',
  'tasks',
  'opportunities',
  'phone_calls',
  'emailer_campaigns',
  'emailer_messages',
  'users',
  'email_accounts',
  'labels',
  'lists',
  'typed_custom_fields',
  'opportunity_stages',
  'contact_stages',
  'account_stages',
  'emailer_steps',
  'news_articles',
  'postal_addresses',
] as const;

function findListKey(obj: Record<string, unknown>): string | undefined {
  return APOLLO_LIST_KEYS.find((k) => Array.isArray(obj[k]));
}

export function output(data: unknown, options: GlobalOptions = {}): void {
  if (options.quiet) return;

  let result: unknown = data;

  if (options.fields && typeof data === 'object' && data !== null) {
    const fields = options.fields.split(',').map((f) => f.trim()).filter(Boolean);
    if (Array.isArray(data)) {
      result = data.map((item) => pickFields(item as Record<string, unknown>, fields));
    } else {
      const obj = data as Record<string, unknown>;
      const listKey = findListKey(obj);
      if (listKey) {
        result = (obj[listKey] as Record<string, unknown>[]).map((item) =>
          pickFields(item, fields),
        );
      } else {
        result = pickFields(obj, fields);
      }
    }
  }

  switch (options.output) {
    case 'pretty':
      console.log(JSON.stringify(result, null, 2));
      return;
    case 'table':
      console.log(formatTable(result));
      return;
    default:
      console.log(JSON.stringify(result));
  }
}

export function outputError(error: unknown, options: GlobalOptions = {}): void {
  const formatted = formatError(error);
  if (options.quiet) {
    process.exitCode = 1;
    return;
  }

  if (options.output === 'pretty') {
    console.error(`Error: ${formatted.message}`);
  } else {
    console.error(JSON.stringify({ error: formatted.message, code: formatted.code }));
  }
  process.exitCode = 1;
}

function pickFields(obj: Record<string, unknown>, fields: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    if (field in obj) {
      result[field] = obj[field];
    }
  }
  return result;
}

/**
 * Render arbitrary data as a human-readable text table.
 *
 * - Arrays of objects → row-per-object with column headers
 * - Single object containing a known Apollo list key → unwraps and tables the list
 * - Single object → two-column key/value table
 * - Primitives → stringified
 */
function formatTable(data: unknown): string {
  if (data === null || data === undefined) return '';

  if (Array.isArray(data)) {
    return tableFromRows(data as Array<Record<string, unknown>>);
  }

  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const listKey = findListKey(obj);
    if (listKey) {
      return tableFromRows(obj[listKey] as Array<Record<string, unknown>>);
    }
    return tableFromKeyValue(obj);
  }

  return String(data);
}

function tableFromRows(rows: Array<Record<string, unknown>>): string {
  if (!rows || rows.length === 0) return '(no rows)';

  const columns = Array.from(
    rows.reduce((set, row) => {
      if (row && typeof row === 'object') {
        for (const k of Object.keys(row)) set.add(k);
      }
      return set;
    }, new Set<string>()),
  );

  if (columns.length === 0) return '(no columns)';

  const headerRow = columns;
  const bodyRows = rows.map((row) => columns.map((c) => stringifyCell(row?.[c])));

  return renderGrid([headerRow, ...bodyRows], { headerSeparator: true });
}

function tableFromKeyValue(obj: Record<string, unknown>): string {
  const rows = Object.entries(obj).map(([k, v]) => [k, stringifyCell(v)]);
  return renderGrid([['key', 'value'], ...rows], { headerSeparator: true });
}

function stringifyCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  // Avoid unbounded JSON dumps in cells — truncate complex objects
  const json = JSON.stringify(value);
  return json.length > 80 ? json.slice(0, 77) + '...' : json;
}

function renderGrid(grid: string[][], options: { headerSeparator?: boolean } = {}): string {
  const widths = grid[0].map((_, col) =>
    grid.reduce((max, row) => Math.max(max, (row[col] ?? '').length), 0),
  );

  const formatRow = (row: string[]) =>
    row.map((cell, col) => (cell ?? '').padEnd(widths[col])).join('  ');

  const lines: string[] = [];
  lines.push(formatRow(grid[0]));
  if (options.headerSeparator) {
    lines.push(widths.map((w) => '-'.repeat(w)).join('  '));
  }
  for (let i = 1; i < grid.length; i++) lines.push(formatRow(grid[i]));
  return lines.join('\n');
}
