/**
 * TypeScript interfaces for Storage Operations
 *
 * @packageDocumentation
 */

/**
 * Storage type: local or session.
 */
export type StorageType = 'local' | 'session';

/**
 * Operation data for saveToStorage operation.
 * Saves data to browser storage (localStorage or sessionStorage).
 */
export interface ISaveToStorageOperationData {
  /** Which storage to use */
  storageType: StorageType;
  /** Storage key */
  key: string;
  /** Data to save (will be JSON stringified) */
  data: any;
  /** Expiration time in milliseconds (localStorage only, optional) */
  expiration?: number;
  /** True if saved successfully (output) */
  success?: boolean;
  /** Error message (e.g., QuotaExceededError) (output) */
  error?: string;
}

/**
 * Operation data for loadFromStorage operation.
 * Retrieves data from browser storage.
 */
export interface ILoadFromStorageOperationData {
  /** Which storage to use */
  storageType: StorageType;
  /** Storage key */
  key: string;
  /** Loaded data (JSON parsed), null if not found or expired (output) */
  data?: any;
  /** True if key existed (output) */
  found?: boolean;
  /** Error message if operation failed (output) */
  error?: string;
}

/**
 * Operation data for clearStorage operation.
 * Removes item(s) from browser storage.
 */
export interface IClearStorageOperationData {
  /** Which storage to use */
  storageType: StorageType;
  /** Storage key to remove (null/undefined = clear all) */
  key?: string;
  /** True if cleared successfully (output) */
  cleared?: boolean;
  /** Error message if operation failed (output) */
  error?: string;
}
