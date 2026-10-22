import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {TOperation} from '@operation/types.ts';

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
  loadedValue?: any;
}

/**
 * Loads data from browser storage (localStorage or sessionStorage).
 *
 * Deserializes the stored JSON value. Returns `null` if key doesn't exist.
 * When `storageType` is omitted, localStorage is used.
 *
 * @returns Operation data with `loadedValue` containing the deserialized data
 * @throws When the key is empty, storageType is not 'local' or 'session', or the stored value is not valid JSON.
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
  Omit<ILoadFromStorageOperationData, 'key' | 'storageType'>
> = (operationData: ILoadFromStorageOperationData) => {
  const {key, storageType} = operationData;

  if (!key || key.trim() === '') {
    throw new Error('loadFromStorage: key is required');
  }

  // A missing storageType keeps the long-standing localStorage default; any other
  // value, such as a typo, must not silently read from the wrong storage
  if (
    storageType !== undefined &&
    storageType !== 'local' &&
    storageType !== 'session'
  ) {
    throw new Error(
      `loadFromStorage: storageType must be 'local' or 'session', got "${String(storageType)}"`
    );
  }

  const storage = storageType === 'session' ? sessionStorage : localStorage;
  const stored = storage.getItem(key);

  if (stored === null) {
    operationData.loadedValue = null;
  } else {
    try {
      operationData.loadedValue = JSON.parse(stored);
    } catch (error) {
      throw new Error(
        `loadFromStorage: failed to parse stored value for key "${key}"`,
        {cause: error}
      );
    }
  }

  removeProperties(operationData, 'key', 'storageType');

  return operationData;
};
