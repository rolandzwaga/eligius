import type {IEventbus} from '@eventbus/types.ts';

/**
 * Requests the entry registered under `systemName` through the
 * `request-function` event, and fails with an error that names the calling
 * operation when there is none.
 *
 * The `request-function` responder (registered by `EngineFactory`) may throw
 * for an unknown name, and the default importer then adds a "did you mean"
 * hint. That message is kept and the original error becomes the `cause`.
 *
 * @param eventbus - The eventbus to send the request on
 * @param operationName - The name of the calling operation, used as the message prefix
 * @param systemName - The configured name to look up
 * @param noun - What is being looked up, for the message (for example `'function'`)
 * @returns The registered entry, never `undefined` or `null`
 * @throws Error when the lookup throws or nothing is registered under `systemName`
 */
export function requestRegisteredEntry(
  eventbus: IEventbus,
  operationName: string,
  systemName: string,
  noun?: string
): unknown {
  let entry: unknown;
  try {
    entry = eventbus.request<unknown>('request-function', systemName);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    const what = noun ? `${noun} '${systemName}'` : `'${systemName}'`;
    throw new Error(`${operationName}: could not retrieve ${what}. ${reason}`, {
      cause: error,
    });
  }

  if (entry === undefined || entry === null) {
    const nothing = noun ? `no ${noun}` : 'nothing';
    throw new Error(
      `${operationName}: ${nothing} registered for systemName '${systemName}'. Check the spelling, or make sure the resource importer provides it.`
    );
  }

  return entry;
}
