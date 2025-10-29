import {removeProperties} from './helper/remove-operation-properties.ts';
import type {TOperation} from './types.ts';

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
 *
 * @returns Operation data with storage properties erased
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
  Omit<ISaveToStorageOperationData, 'value' | 'storageType'>
> = (operationData: ISaveToStorageOperationData) => {
  const {key, value, storageType} = operationData;

  if (!key || key.trim() === '') {
    throw new Error('saveToStorage: key is required');
  }

  const storage = storageType === 'session' ? sessionStorage : localStorage;
  const serialized = JSON.stringify(value);
  storage.setItem(key, serialized);

  removeProperties(operationData, 'value', 'storageType');

  return operationData;
};
