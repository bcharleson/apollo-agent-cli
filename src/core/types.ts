import { z } from 'zod';

export interface CliMapping {
  args?: Array<{
    field: string;
    name: string;
    required?: boolean;
  }>;
  options?: Array<{
    field: string;
    flags: string;
    description?: string;
  }>;
}

export interface CommandDefinition<TInput extends z.ZodObject<any> = z.ZodObject<any>> {
  /** Unique identifier, used as MCP tool name. e.g., "contacts_search" */
  name: string;

  /** CLI group. e.g., "contacts" */
  group: string;

  /** CLI subcommand name. e.g., "search" */
  subcommand: string;

  /** Human-readable description (used in --help AND MCP tool description) */
  description: string;

  /** Detailed examples for --help output */
  examples?: string[];

  /** Zod schema defining all inputs */
  inputSchema: TInput;

  /** Maps Zod fields to CLI constructs (args and options) */
  cliMappings: CliMapping;

  /** HTTP method and path template */
  endpoint: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    path: string;
  };

  /**
   * Where each input field goes in the HTTP request. Required when using
   * the generic `executeCommand` handler. May be omitted (or empty) for
   * commands that ship a custom handler and build their request manually.
   */
  fieldMappings?: Record<string, 'path' | 'query' | 'body'>;

  /** Whether this is a paginated list endpoint */
  paginated?: boolean;

  /** The handler function */
  handler: (input: z.infer<TInput>, client: ApolloClient) => Promise<unknown>;
}

export interface ApolloClient {
  request<T>(options: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    path: string;
    query?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
  }): Promise<T>;

  get<T>(path: string, query?: Record<string, any>): Promise<T>;
  post<T>(path: string, body?: unknown, query?: Record<string, any>): Promise<T>;
  patch<T>(path: string, body?: unknown): Promise<T>;
  delete<T>(path: string, query?: Record<string, any>): Promise<T>;
}

export interface ApolloConfig {
  api_key: string;
}

export interface GlobalOptions {
  apiKey?: string;
  output?: 'json' | 'pretty' | 'table';
  quiet?: boolean;
  fields?: string;
}
