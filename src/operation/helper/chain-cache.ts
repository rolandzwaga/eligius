import {isForbiddenPropertyChainSegment} from '@operation/helper/assert-safe-property-chain.ts';

/**
 * Property chain parsing, shared by every helper that reads or writes a
 * chain, with a cache for the chains written in configuration.
 *
 * Before, every read of `$operationdata.items[2].label` split the text,
 * lower-cased the prefix, expanded the bracket index with a regular
 * expression, checked every segment for forbidden names and split the last
 * segment on `+`, on every execution. The chain text comes from the
 * configuration, so the parsed form is computed once and reused. Errors keep
 * their exact messages: they are built when they are thrown, from the parsed
 * chain and the name of the operation that is running.
 */

/**
 * A property chain prepared for {@link walkChain}.
 */
export interface IParsedSegments {
  /** The segments after bracket expansion: `items[2].label` gives `['items', '2', 'label']` */
  segments: string[];
  /** `segments` joined with dots, as the error messages print the chain */
  chainText: string;
  /** The last segment without its `+suffix` */
  lastProperty: string;
  /** The text after the `+` of the last segment, or null when there is none */
  suffix: string | null;
  /** The first segment as written, before expansion */
  head: string;
  /** The first forbidden segment, with the chain text the error names */
  forbidden: {chainText: string; segment: string} | undefined;
}

export type TChainPrefix = 'operationdata' | 'globaldata' | 'scope';

/**
 * A parsed `$operationdata.`, `$globaldata.` or `$scope.` chain.
 */
export interface IParsedChain extends IParsedSegments {
  prefix: TChainPrefix;
}

const bracketPattern = /\[(\d+)\]/g;

/**
 * Expands bracket indices into their own segments and drops empty segments,
 * so `items[2].label` and `items.2.label` resolve the same way.
 */
export function expandSegments(unexpanded: readonly string[]): string[] {
  const segments: string[] = [];
  for (const segment of unexpanded) {
    if (!segment.includes('[') && !segment.includes('.')) {
      if (segment.length > 0) {
        segments.push(segment);
      }
      continue;
    }
    for (const part of segment.replace(bracketPattern, '.$1').split('.')) {
      if (part.length > 0) {
        segments.push(part);
      }
    }
  }
  return segments;
}

/**
 * Returns the first segment whose name (before a `+suffix`) is forbidden.
 */
export function findForbiddenSegment(
  segments: readonly string[]
): string | undefined {
  for (const segment of segments) {
    const name = segment.split('+')[0];
    if (isForbiddenPropertyChainSegment(name)) {
      return name;
    }
  }
  return undefined;
}

/**
 * Parses chain segments once.
 *
 * @param unexpanded The segments as written, split on dots
 * @param writtenChain The whole chain as written in the configuration. When
 * given, a forbidden segment found before expansion is reported with this
 * text; one found only after expansion is reported with the expanded chain.
 */
export function parseSegments(
  unexpanded: readonly string[],
  writtenChain?: string
): IParsedSegments {
  let forbidden: IParsedSegments['forbidden'];
  if (writtenChain !== undefined) {
    const segment = findForbiddenSegment(unexpanded);
    if (segment !== undefined) {
      forbidden = {chainText: writtenChain, segment};
    }
  }
  const segments = expandSegments(unexpanded);
  const chainText = segments.join('.');
  if (forbidden === undefined) {
    const segment = findForbiddenSegment(segments);
    if (segment !== undefined) {
      forbidden = {chainText, segment};
    }
  }
  const last = segments.length > 0 ? segments[segments.length - 1] : '';
  const plus = last.indexOf('+');
  return {
    segments,
    chainText,
    lastProperty: plus >= 0 ? last.substring(0, plus) : last,
    suffix: plus >= 0 ? last.substring(plus + 1).split('+')[0] : null,
    head: unexpanded[0] ?? '',
    forbidden,
  };
}

function messagePrefix(operationName: string | undefined): string {
  return operationName ? `${operationName}: property chain` : 'Property chain';
}

/**
 * Throws when the parsed chain contains a forbidden segment.
 *
 * @throws Error naming the operation, the chain and the segment
 */
export function assertParsedChainSafe(
  parsed: IParsedSegments,
  operationName?: string
): void {
  if (parsed.forbidden === undefined) {
    return;
  }
  throw new Error(
    `${messagePrefix(operationName)} '${parsed.forbidden.chainText}' contains forbidden segment '${parsed.forbidden.segment}'. Property chains may not contain __proto__, prototype or constructor.`
  );
}

function globalObjectError(
  operationName: string | undefined,
  parsed: IParsedSegments,
  index: number
): Error {
  return new Error(
    `${messagePrefix(operationName)} '${parsed.chainText}' reaches the global object at '${parsed.segments
      .slice(0, index)
      .join('.')}'. Property chains may not access the global object.`
  );
}

/**
 * Returns true for the global object (`window`), including the window of another frame.
 */
export function isGlobalObject(value: unknown): boolean {
  return (
    value === globalThis ||
    (typeof value === 'object' &&
      value !== null &&
      Object.prototype.toString.call(value) === '[object Window]')
  );
}

/**
 * Reads a parsed chain from `sourceObject`.
 *
 * An empty chain returns `sourceObject`. Only null and undefined cannot be
 * indexed; `''`, `0` and `false` are valid intermediates. A `+suffix` on the
 * last segment is appended to the value; an empty suffix returns the value
 * as it is.
 *
 * @throws When an intermediate value is null or undefined (the message names
 * the part of the chain that did resolve), or when the chain passes through
 * or ends at the global object
 */
export function walkChain(
  parsed: IParsedSegments,
  sourceObject: Record<string, any>,
  operationName?: string
): unknown {
  const {segments} = parsed;
  const count = segments.length;
  let current: any = sourceObject;
  for (let index = 0; index < count; index++) {
    if (current === null || current === undefined) {
      throw new Error(
        `${messagePrefix(operationName)} '${parsed.chainText}' cannot be resolved: '${segments
          .slice(0, index)
          .join('.')}' is ${current}.`
      );
    }
    if (index > 0 && isGlobalObject(current)) {
      throw globalObjectError(operationName, parsed, index);
    }
    current =
      current[index === count - 1 ? parsed.lastProperty : segments[index]];
  }
  if (count > 0 && isGlobalObject(current)) {
    throw globalObjectError(operationName, parsed, count);
  }
  return parsed.suffix ? `${current}${parsed.suffix}` : current;
}

const prefixes: Record<string, TChainPrefix | undefined> = {
  '$operationdata.': 'operationdata',
  '$globaldata.': 'globaldata',
  '$scope.': 'scope',
};

/**
 * Returns the kind of external chain `value` is, or undefined when it is not
 * one. The prefix is matched without regard to case, like before.
 */
export function externalPrefixOf(value: string): TChainPrefix | undefined {
  if (value.charCodeAt(0) !== 36 /* $ */) {
    return undefined;
  }
  const dot = value.indexOf('.');
  if (dot < 0) {
    return undefined;
  }
  return prefixes[value.substring(0, dot + 1).toLocaleLowerCase()];
}

/**
 * The cache is cleared when it grows past this size, so chains built at
 * runtime cannot leak memory.
 */
const MAX_CACHED_CHAINS = 2000;
const parsedChains = new Map<string, IParsedChain>();

/**
 * Returns the parsed form of an external property chain, parsing it on the
 * first use, or null when `value` is not an external chain.
 */
export function getParsedChain(value: string): IParsedChain | null {
  const cached = parsedChains.get(value);
  if (cached !== undefined) {
    return cached;
  }
  const prefix = externalPrefixOf(value);
  if (prefix === undefined) {
    return null;
  }
  const unexpanded = value.split('.');
  unexpanded.shift();
  const parsed: IParsedChain = {...parseSegments(unexpanded, value), prefix};
  if (parsedChains.size >= MAX_CACHED_CHAINS) {
    parsedChains.clear();
  }
  parsedChains.set(value, parsed);
  return parsed;
}

/**
 * Empties the chain cache. `EngineFactory` calls this when the last engine
 * is destroyed.
 */
export function clearChainCache(): void {
  parsedChains.clear();
}
