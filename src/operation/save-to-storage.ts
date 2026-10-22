import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {TOperation} from '@operation/types.ts';

export type StorageType = 'local' | 'session';

export interface ISaveToStorageOperationData {
  /**
   * @required
   * @erased
   */
  key: string;
  /**
   * @required
   * @erased
   */
  value: any;
  /**
   * @required
   * @erased
   */
  storageType: StorageType;
}

/**
 * Saves data to browser storage (localStorage or sessionStorage).
 *
 * Serializes the value as JSON before storing. Supports any JSON-serializable data type.
 * Use `null` to store an empty value; `undefined` cannot be stored as JSON and is rejected.
 * When `storageType` is omitted, localStorage is used.
 *
 * @returns Operation data with storage properties erased
 * @throws When the key is empty, the value is undefined, or storageType is not 'local' or 'session'.
 *
 * @example
 * ```typescript
 * // Save user settings to localStorage
 * const result = saveToStorage({
 *   key: 'user-settings',
 *   value: { theme: 'dark', language: 'en' },
 *   storageType: 'local'
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Save session data
 * const result = saveToStorage({
 *   key: 'session-id',
 *   value: 'abc123',
 *   storageType: 'session'
 * });
 * ```
 *
 * @category Data
 */
export const saveToStorage: TOperation<
  ISaveToStorageOperationData,
  Omit<ISaveToStorageOperationData, 'key' | 'value' | 'storageType'>
> = (operationData: ISaveToStorageOperationData) => {
  const {key, value, storageType} = operationData;

  if (!key || key.trim() === '') {
    throw new Error('saveToStorage: key is required');
  }

  // A missing storageType keeps the long-standing localStorage default; any other
  // value, such as a typo, must not silently write to persistent storage
  if (
    storageType !== undefined &&
    storageType !== 'local' &&
    storageType !== 'session'
  ) {
    throw new Error(
      `saveToStorage: storageType must be 'local' or 'session', got "${String(storageType)}"`
    );
  }

  // JSON.stringify(undefined) is undefined, which setItem would store as the
  // string 'undefined' that loadFromStorage cannot parse
  if (value === undefined) {
    throw new Error(`saveToStorage: value is required (key "${key}")`);
  }

  const storage = storageType === 'session' ? sessionStorage : localStorage;
  const serialized = JSON.stringify(value);
  storage.setItem(key, serialized);

  removeProperties(operationData, 'key', 'value', 'storageType');

  return operationData;
};
