import {removeProperties} from './helper/remove-operation-properties.ts';
import type {TOperation} from './types.ts';

export type StorageType = 'local' | 'session';

export interface ILoadFromStorageOperationData {
  /**
   * @required
   * @erased
   */
  key: string;
  /**
   * @required
   * @erased
   */
  storageType: StorageType;
  /**
   * @output
   */
  loadedValue: any;
}

/**
 * Loads data from browser storage (localStorage or sessionStorage).
 *
 * Deserializes the stored JSON value. Returns `null` if key doesn't exist.
 *
 * @returns Operation data with `loadedValue` containing the deserialized data
 *
 * @example
 * ```typescript
 * // Load user settings from localStorage
 * const result = loadFromStorage({
 *   key: 'user-settings',
 *   storageType: 'local'
 * });
 * // result.loadedValue = { theme: 'dark', language: 'en' }
 * ```
 *
 * @example
 * ```typescript
 * // Load session data
 * const result = loadFromStorage({
 *   key: 'session-id',
 *   storageType: 'session'
 * });
 * // result.loadedValue = 'abc123' or null if not found
 * ```
 *
 * @category Data
 */
export const loadFromStorage: TOperation<
  ILoadFromStorageOperationData,
  Omit<ILoadFromStorageOperationData, 'storageType'>
> = (operationData: ILoadFromStorageOperationData) => {
  const {key, storageType} = operationData;

  if (!key || key.trim() === '') {
    throw new Error('loadFromStorage: key is required');
  }

  const storage = storageType === 'session' ? sessionStorage : localStorage;
  const stored = storage.getItem(key);

  if (stored === null) {
    operationData.loadedValue = null;
  } else {
    try {
      operationData.loadedValue = JSON.parse(stored);
    } catch {
      throw new Error(
        `loadFromStorage: failed to parse stored value for key "${key}"`
      );
    }
  }

  removeProperties(operationData, 'storageType');

  return operationData;
};
