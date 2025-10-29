import {removeProperties} from './helper/remove-operation-properties.ts';
import type {TOperation} from './types.ts';

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

  const storage = storageType === 'session' ? sessionStorage : localStorage;

  if (key && key.trim() !== '') {
    storage.removeItem(key);
  } else {
    storage.clear();
  }

  removeProperties(operationData, 'key', 'storageType');

  return operationData;
};
