/**
 * Request: request-function
 * Answered through `eventbus.request('request-function', systemName)` by
 * EngineFactory with the function (such as an operation) the resource
 * importer provides under that name. Throws for an unknown name.
 * @param systemName - The name of the function to request
 * @returns The function
 * @category Engine Request
 */
export interface RequestFunctionEvent {
  name: 'request-function';
  args: [systemName: string];
  returns: unknown;
}
