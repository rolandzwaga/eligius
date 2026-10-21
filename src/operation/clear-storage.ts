import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {TOperation} from '@operation/types.ts';

export type StorageType = 'local' | 'session';

export interface IClearStorageOperationData {
  /**
   * @optional
   * @erased
   */
  key?: string;
  /**
   * @required
   * @erased
   */
  storageType: StorageType;
}

/**
 * Clears data from browser storage (localStorage or sessionStorage).
 *
 * If `key` is provided, removes only that key. If `key` is omitted, clears all storage.
 * A `key` that is present but empty, blank or not a string is rejected, so a value resolved
 * from missing data never wipes the whole storage.
 *
 * @throws When `key` is present but is not a non-empty string.
 *
 * @returns Operation data with storage properties erased
 *
 * @example
 * ```typescript
 * // Clear specific key
 * const result = clearStorage({
 *   key: 'user-settings',
 *   storageType: 'local'
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Clear all localStorage
 * const result = clearStorage({
 *   storageType: 'local'
 * });
 * ```
 *
 * @category Data
 */
export const clearStorage: TOperation<
  IClearStorageOperationData,
  Omit<IClearStorageOperationData, 'key' | 'storageType'>
> = (operationData: IClearStorageOperationData) => {
  const {key, storageType} = operationData;

  if (key !== undefined && (typeof key !== 'string' || key.trim() === '')) {
    throw new Error('clearStorage: key must be a non-empty string');
  }

  const storage = storageType === 'session' ? sessionStorage : localStorage;

  if (key === undefined) {
    storage.clear();
  } else {
    storage.removeItem(key);
  }

  removeProperties(operationData, 'key', 'storageType');

  return operationData;
};
