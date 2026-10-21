/**
 * Request: request-instance
 * Answered through `eventbus.request('request-instance', systemName)` by
 * EngineFactory with a new instance of the class the resource importer
 * provides under that name (a controller, for example), constructed with the
 * eventbus. Throws for an unknown name.
 * @param systemName - The name of the class to instantiate
 * @returns The new instance
 * @category Engine Request
 */
export interface RequestInstanceEvent {
  name: 'request-instance';
  args: [systemName: string];
  returns: unknown;
}
