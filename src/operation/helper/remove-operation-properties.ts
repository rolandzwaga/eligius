/**
 * Removes specified properties from an operation data object.
 * This is a helper function to eliminate repetitive property deletion code across operations.
 *
 * @template T - The type of the operation data object
 * @template K - The keys to remove from the object (must be keys of T)
 * @param operationData - The operation data object to mutate
 * @param keys - The property keys to delete from the object
 * @returns The mutated operation data object with specified properties removed (typed as Omit<T, K>)
 *
 * @example
 * ```typescript
 * interface IMyOperationData {
 *   selectedElement: JQuery;
 *   animationDuration: number;
 *   animationEasing: string;
 * }
 *
 * const data: IMyOperationData = {
 *   selectedElement: $element,
 *   animationDuration: 500,
 *   animationEasing: 'ease-in'
 * };
 *
 * // Remove multiple properties at once
 * const result = removeProperties(data, 'animationDuration', 'animationEasing');
 * // result is typed as Omit<IMyOperationData, 'animationDuration' | 'animationEasing'>
 * // result = { selectedElement: $element }
 * ```
 */
export function removeProperties<T extends object, K extends keyof T>(
  operationData: T,
  ...keys: K[]
): Omit<T, K> {
  for (const key of keys) {
    delete (operationData as any)[key];
  }
  return operationData as Omit<T, K>;
}
