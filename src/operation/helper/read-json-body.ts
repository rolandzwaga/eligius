/**
 * Reads a fetch response body as JSON for the HTTP operations.
 *
 * A 204 No Content or 205 Reset Content response, or an empty body, yields
 * `null` instead of a parse error.
 *
 * @param response - The fetch response to read
 * @param operationName - Name of the calling operation, used in error messages
 * @returns The parsed JSON value, or null when there is no body
 * @throws Error naming the operation when the body is not valid JSON
 */
export async function readJsonBody(
  response: Response,
  operationName: string
): Promise<any> {
  if (response.status === 204 || response.status === 205) {
    return null;
  }
  const text = await response.text();
  if (text.trim() === '') {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(
      `${operationName}: invalid JSON response: ${(error as Error).message}`,
      {cause: error}
    );
  }
}
