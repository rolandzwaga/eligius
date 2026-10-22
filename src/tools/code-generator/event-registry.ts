import {type InterfaceDeclaration, Node, type SourceFile} from 'ts-morph';

/**
 * Helpers of the event metadata generator for the event index and the
 * generated `RequestMap`.
 */

/**
 * Returns the event files that `src/eventbus/events/index.ts` does not export
 * from, so an event that was added without an index entry fails generation
 * instead of silently missing from the public API.
 *
 * @param eventFileNames - Base names of the event files, such as `timeline-play.ts`
 * @param indexFile - The events index file
 * @param alias - The path alias of the events directory, such as `@eventbus/events`
 * @returns The base names without an export in the index, in input order
 */
export function findEventFilesMissingFromIndex(
  eventFileNames: readonly string[],
  indexFile: SourceFile,
  alias: string
): string[] {
  const exported = new Set(
    indexFile
      .getExportDeclarations()
      .map(declaration => declaration.getModuleSpecifierValue())
      .filter((specifier): specifier is string => specifier !== undefined)
  );
  return eventFileNames.filter(
    fileName => !exported.has(`${alias}/${fileName}`)
  );
}

/**
 * A request event: an event interface that declares a `returns` property,
 * answered through `eventbus.onRequest()` and `eventbus.request()`.
 */
export interface IRequestEventName {
  /** The request name, the `name` literal of the interface */
  eventName: string;
  /** The name of the event interface */
  interfaceName: string;
}

/**
 * Returns the request events among the given event interfaces: those with a
 * `returns` property and a string literal `name`.
 *
 * @param interfaces - Event interfaces
 * @returns One entry per request event, in input order
 */
export function getRequestEventNames(
  interfaces: readonly InterfaceDeclaration[]
): IRequestEventName[] {
  return interfaces.flatMap(iface => {
    if (!iface.getProperty('returns')) {
      return [];
    }
    const eventName = getEventNameLiteral(iface);
    if (eventName === undefined) {
      return [];
    }
    return [{eventName, interfaceName: iface.getName()}];
  });
}

/**
 * Returns the string literal of the interface's `name` property, or
 * `undefined` when it is not a string literal type.
 */
function getEventNameLiteral(iface: InterfaceDeclaration): string | undefined {
  const nameType = iface.getProperty('name')?.getTypeNode();
  if (!nameType || !Node.isLiteralTypeNode(nameType)) {
    return undefined;
  }
  const literal = nameType.getLiteral();
  return Node.isStringLiteral(literal) ? literal.getLiteralValue() : undefined;
}

/**
 * Returns the event names that more than one event interface declares. The
 * generated `EventMap` would silently merge such events into one entry whose
 * arguments are the union of both, so generation must fail instead.
 *
 * @param interfaces - Event interfaces
 * @returns One message per duplicated name, naming the interfaces, in order of
 * first appearance
 */
export function findDuplicateEventNames(
  interfaces: readonly InterfaceDeclaration[]
): string[] {
  const byName = new Map<string, string[]>();
  for (const iface of interfaces) {
    const eventName = getEventNameLiteral(iface);
    if (eventName === undefined) {
      continue;
    }
    const names = byName.get(eventName) ?? [];
    names.push(iface.getName());
    byName.set(eventName, names);
  }
  return [...byName]
    .filter(([, names]) => names.length > 1)
    .map(([eventName, names]) => `'${eventName}' (${names.join(', ')})`);
}

/**
 * Adds the exported `RequestMap` interface to `outputFile`: one entry per
 * request event, sorted by request name, with the event's `args` and
 * `returns` types. The event interfaces must be imported by the caller.
 *
 * @param outputFile - The generated types file
 * @param requestEvents - The request events, see {@link getRequestEventNames}
 */
export function writeRequestMap(
  outputFile: SourceFile,
  requestEvents: readonly IRequestEventName[]
): void {
  const sorted = [...requestEvents].sort((a, b) =>
    a.eventName.localeCompare(b.eventName)
  );
  outputFile.addInterface({
    name: 'RequestMap',
    isExported: true,
    docs: [
      [
        'The request/response queries that Eligius itself answers through',
        '`IEventbus.onRequest`, with the arguments each takes and the value it',
        'returns. Generated from the event interfaces in `src/eventbus/events`',
        'that declare a `returns` property.',
        '',
        'Querying one of these names with `IEventbus.request` (without an',
        'explicit type argument) types the response, and registering a',
        'responder for one with `IEventbus.onRequest` checks the signature.',
        'The untyped string overloads remain for custom request names.',
      ].join('\n'),
    ],
    properties: sorted.map(({eventName, interfaceName}) => ({
      name: `'${eventName}'`,
      type: `{args: ${interfaceName}['args']; returns: ${interfaceName}['returns']}`,
    })),
  });
}
