/**
 * TypeScript interfaces for HTTP Operations
 *
 * @packageDocumentation
 */

/**
 * Operation data for httpPost operation.
 * Sends POST request to URL.
 */
export interface IHttpPostOperationData {
  /** Target URL */
  url: string;
  /** Data payload to send (will be JSON stringified) */
  data: any;
  /** Custom HTTP headers */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Response data (JSON parsed if possible) (output) */
  responseData?: any;
  /** HTTP status code (output) */
  status?: number;
  /** True if 200-299 status (output) */
  success?: boolean;
  /** Error message if request failed (output) */
  error?: string;
}

/**
 * Operation data for httpPut operation.
 * Sends PUT request to URL.
 */
export interface IHttpPutOperationData {
  /** Target URL */
  url: string;
  /** Data payload to send (will be JSON stringified) */
  data: any;
  /** Custom HTTP headers */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Response data (JSON parsed if possible) (output) */
  responseData?: any;
  /** HTTP status code (output) */
  status?: number;
  /** True if 200-299 status (output) */
  success?: boolean;
  /** Error message if request failed (output) */
  error?: string;
}

/**
 * Operation data for httpDelete operation.
 * Sends DELETE request to URL.
 */
export interface IHttpDeleteOperationData {
  /** Target URL */
  url: string;
  /** Custom HTTP headers */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Response data (JSON parsed if possible) (output) */
  responseData?: any;
  /** HTTP status code (output) */
  status?: number;
  /** True if 200-299 status (output) */
  success?: boolean;
  /** Error message if request failed (output) */
  error?: string;
}
