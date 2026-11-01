/**
 * The operation data fields in which an operation resolves `$operationdata.`,
 * `$globaldata.` and `$scope.` property chains. A chain in any other field of
 * any operation is passed on as text, which the linter reports (W150).
 *
 * This list is maintained by hand. The conformance test in
 * `src/test/unit/lint/resolving-fields.spec.ts` checks that exactly the
 * operations listed here import a chain-resolving helper, so a new resolving
 * operation cannot be forgotten and a removed one cannot linger.
 */
export const RESOLVING_FIELDS: Readonly<Record<string, readonly string[]>> = {
  broadcastEvent: ['eventArgs'],
  calc: ['left', 'right', 'operator'],
  createElement: ['elementName', 'attributes', 'text'],
  forEach: ['collection'],
  math: ['args', 'functionName'],
  selectElement: ['selector'],
  setData: ['properties'],
  setOperationData: ['properties'],
  setStyle: ['properties'],
  when: ['expression'],
};

/**
 * True when `systemName` resolves chains in its `field`.
 */
export function resolvesField(systemName: string, field: string): boolean {
  return (
    Object.hasOwn(RESOLVING_FIELDS, systemName) &&
    RESOLVING_FIELDS[systemName].includes(field)
  );
}
