import type {IOperationConfiguration} from '@configuration/types.ts';
import {
  findForbiddenSegment,
  getParsedChain,
} from '@operation/helper/chain-cache.ts';
import {findFlowControlProblems} from '@operation/helper/flow-control-structure.ts';
import {
  parseExpression,
  type TExpressionNode,
} from '@operation/helper/parse-expression.ts';
import type {IOperationMetadata} from '@operation/metadata/types.ts';
import type {TOperationData} from '@operation/types.ts';
import {findClosestNames, formatDidYouMean} from '@util/find-closest-names.ts';
import {isPlainObject} from '@util/guards/is-plain-object.ts';
import {
  type IOperationList,
  isOperationConfiguration,
} from './operation-lists.ts';
import {
  findProducers,
  getOperationMetadata,
  isErasedProperty,
  isRequiredProperty,
  literalValuesOf,
} from './operation-metadata.ts';
import {resolvesField} from './resolving-fields.ts';
import type {ILintDiagnostic, TLintSeverity} from './types.ts';

/**
 * What the rules know about the configuration as a whole.
 */
export interface ILintContext {
  diagnostics: ILintDiagnostic[];
  /** `actions[].name` and `eventActions[].name`, the names `requestAction` accepts */
  actionNames: ReadonlySet<string>;
  /** Names declared through the `customOperations` option */
  customOperations: ReadonlySet<string>;
}

type TOperation = IOperationConfiguration<TOperationData>;
type TMetadata = IOperationMetadata<Record<string, unknown>>;

/**
 * Scope fields the engine uses to run an action. Writing them with `setData`
 * breaks the action; `newIndex` is left out because writing it is the
 * documented way to jump.
 */
const RESERVED_SCOPE_KEYS: ReadonlySet<string> = new Set([
  'eventbus',
  'operations',
  'currentIndex',
  'parent',
  'owner',
  'loopIndex',
  'loopLength',
  'loopStartIndex',
  'loopEndIndex',
]);

const DATA_TARGETS = ['scope', 'operationdata', 'globaldata'];

const identifierPattern = /^[A-Za-z_$][\w$]*$/;

/**
 * Appends a key to a JSON path, in the resolver's notation: dots for plain
 * keys, brackets for everything else.
 */
export function childPath(path: string, key: string | number): string {
  if (typeof key === 'number') {
    return `${path}[${key}]`;
  }
  return identifierPattern.test(key)
    ? `${path}.${key}`
    : `${path}['${key.replace(/'/g, "\\'")}']`;
}

/**
 * The operation data keys that are known to be present when an operation
 * runs, following the list from its start. It never removes a key: a key
 * erased or cleared inside a branch may still be present on another path,
 * so the rules only report what is missing on every path.
 */
class DataFlow {
  private readonly _known = new Set<string>();
  /**
   * True once the data can hold anything: the list started with caller-owned
   * data, or an operation ran whose effect on the data is not described.
   */
  private _unknown: boolean;

  constructor(startsEmpty: boolean) {
    this._unknown = !startsEmpty;
  }

  /** True when the absence of a key is certain, not merely undescribed */
  get certain(): boolean {
    return !this._unknown;
  }

  has(key: string): boolean {
    return this._known.has(key);
  }

  /**
   * Records what `operation` leaves in the data for the operations after it.
   */
  after(
    operation: TOperation,
    data: Record<string, unknown> | undefined,
    metadata: TMetadata | undefined
  ): void {
    if (metadata === undefined) {
      // A custom or unknown operation may add anything
      this._unknown = true;
    }
    switch (operation.systemName) {
      case 'setOperationData':
        if (data && isPlainObject(data.properties)) {
          for (const key of Object.keys(data.properties)) {
            this._known.add(key);
          }
        }
        break;
      case 'setData':
        if (data && isPlainObject(data.properties)) {
          for (const target of Object.keys(data.properties)) {
            const segments = target.split('.');
            if (
              segments[0].toLowerCase() === '$operationdata' &&
              segments.length === 2
            ) {
              this._known.add(segments[1]);
            }
          }
        }
        break;
      case 'addGlobalsToOperation':
        if (data && Array.isArray(data.globalProperties)) {
          for (const name of data.globalProperties) {
            if (typeof name === 'string') {
              this._known.add(name);
            }
          }
        }
        break;
      case 'customFunction':
      case 'startAction':
      case 'endAction':
        // The function or the called action may change the data in any way
        this._unknown = true;
        break;
      default:
        break;
    }
    if (metadata?.outputProperties) {
      for (const key of Object.keys(metadata.outputProperties)) {
        this._known.add(key);
      }
    }
    if (data) {
      for (const key of Object.keys(data)) {
        if (
          data[key] !== undefined &&
          !isErasedProperty(metadata?.properties?.[key])
        ) {
          this._known.add(key);
        }
      }
    }
  }
}

/**
 * Runs every operation-level rule over one operation list.
 */
export function lintOperationList(
  list: IOperationList,
  context: ILintContext
): void {
  const report = (
    code: string,
    severity: TLintSeverity,
    path: string,
    message: string
  ) => {
    context.diagnostics.push({code, severity, path, message});
  };

  // E101: control-flow blocks must be balanced and nested
  const systemNames = list.operations.map(operation =>
    isOperationConfiguration(operation) ? operation.systemName : ''
  );
  for (const problem of findFlowControlProblems(systemNames)) {
    report(
      'E101',
      'error',
      childPath(childPath(list.path, problem.index), 'systemName'),
      `${problem.message} The engine pops the wrong scope at runtime, and the action fails or runs with the wrong data.`
    );
  }

  const flow = new DataFlow(list.startsEmpty);

  list.operations.forEach((operation, index) => {
    if (!isOperationConfiguration(operation)) {
      return;
    }
    const {systemName} = operation;
    const operationPath = childPath(list.path, index);
    const dataPath = childPath(operationPath, 'operationData');
    const data = isPlainObject(operation.operationData)
      ? (operation.operationData as Record<string, unknown>)
      : undefined;
    const metadata = getOperationMetadata(systemName);
    const isCustom = context.customOperations.has(systemName);
    const hasOwnData = (key: string) =>
      data !== undefined && Object.hasOwn(data, key) && data[key] !== undefined;
    const isAvailable = (key: string) => flow.has(key) || hasOwnData(key);

    const reportUnknownRead = (chain: string, head: string, path: string) => {
      if (flow.certain && head !== '' && !isAvailable(head)) {
        report(
          'W151',
          'warning',
          path,
          `${systemName}: '${chain}' reads '${head}' from the operation data, but no operation before it in this list provides '${head}'.`
        );
      }
    };

    if (data !== undefined) {
      // E141: a '__proto__' key anywhere in the operation data
      walkData(data, dataPath, (value, path) => {
        if (isPlainObject(value) && Object.hasOwn(value, '__proto__')) {
          report(
            'E141',
            'error',
            childPath(path, '__proto__'),
            `${systemName}: operation data must not contain a '__proto__' key. The engine rejects the operation when it runs.`
          );
        }
      });

      // E140, W150, W151 for property chain strings
      walkData(data, dataPath, (value, path, topKey) => {
        if (typeof value !== 'string' || topKey === undefined) {
          return;
        }
        if (systemName === 'when' && topKey === 'expression') {
          return; // lintWhen checks the operands of the expression
        }
        const parsed = getParsedChain(value);
        if (parsed === null) {
          return;
        }
        if (parsed.forbidden !== undefined) {
          report(
            'E140',
            'error',
            path,
            `${systemName}: property chain '${value}' contains forbidden segment '${parsed.forbidden.segment}'. Property chains may not contain __proto__, prototype or constructor.`
          );
          return;
        }
        if (!resolvesField(systemName, topKey)) {
          if (!isCustom && metadata !== undefined) {
            report(
              'W150',
              'warning',
              path,
              `${systemName}: '${value}' in '${topKey}' is passed on as text, ${systemName} does not resolve property chains in '${topKey}'. Resolve it first with setOperationData, or use a literal value.`
            );
          }
          return;
        }
        if (parsed.prefix === 'operationdata') {
          reportUnknownRead(value, parsed.segments[0] ?? '', path);
        }
      });
    }

    if (systemName === 'when') {
      lintWhen(data, dataPath, report, reportUnknownRead);
    }
    if (systemName === 'setData') {
      lintSetData(data, dataPath, report, reportUnknownRead);
    }
    if (systemName === 'requestAction') {
      lintRequestAction(data, dataPath, context, report);
    }

    if (metadata !== undefined) {
      // E111 / W111: required properties
      for (const [key, property] of Object.entries(metadata.properties ?? {})) {
        if (isRequiredProperty(property) && !isAvailable(key)) {
          report(
            flow.certain ? 'E111' : 'W111',
            flow.certain ? 'error' : 'warning',
            dataPath,
            `${systemName}: '${key}' is required, and neither its operation data nor an operation before it in this list provides it.`
          );
        }
      }
      // E120: literal unions
      for (const [key, property] of Object.entries(metadata.properties ?? {})) {
        const values = literalValuesOf(property);
        const value = data?.[key];
        if (
          values !== undefined &&
          typeof value === 'string' &&
          getParsedChain(value) === null &&
          !values.includes(value)
        ) {
          report(
            'E120',
            'error',
            childPath(dataPath, key),
            `${systemName}: '${key}' must be one of ${values.map(v => `'${v}'`).join(', ')}, got '${value}'.`
          );
        }
      }
      // W110: dependencies on earlier operations
      for (const dependency of metadata.dependentProperties ?? []) {
        const key = String(dependency);
        if (flow.certain && !isAvailable(key)) {
          const producers = findProducers(key);
          const hint =
            producers.length > 0
              ? ` Operations that provide it: ${producers.slice(0, 4).join(', ')}.`
              : '';
          report(
            'W110',
            'warning',
            operationPath,
            `${systemName}: '${key}' must be provided by an earlier operation in this list, but none before it provides it.${hint}`
          );
        }
      }
    }

    flow.after(operation, data, metadata);
  });
}

type TReport = (
  code: string,
  severity: TLintSeverity,
  path: string,
  message: string
) => void;

type TReportUnknownRead = (chain: string, head: string, path: string) => void;

function lintWhen(
  data: Record<string, unknown> | undefined,
  dataPath: string,
  report: TReport,
  reportUnknownRead: TReportUnknownRead
): void {
  const expression = data?.expression;
  if (expression === undefined) {
    return; // E111 reports the missing expression
  }
  const path = childPath(dataPath, 'expression');
  let parsed: TExpressionNode;
  try {
    parsed = parseExpression(expression as string, 'when');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    report(
      /unknown operand/.test(message) ? 'E131' : 'E130',
      'error',
      path,
      message
    );
    return;
  }
  for (const chain of collectChainOperands(parsed)) {
    const parsedChain = getParsedChain(chain);
    if (parsedChain === null) {
      continue;
    }
    if (parsedChain.forbidden !== undefined) {
      report(
        'E140',
        'error',
        path,
        `when: property chain '${chain}' contains forbidden segment '${parsedChain.forbidden.segment}'. Property chains may not contain __proto__, prototype or constructor.`
      );
    } else if (parsedChain.prefix === 'operationdata') {
      reportUnknownRead(chain, parsedChain.segments[0] ?? '', path);
    }
  }
}

function collectChainOperands(node: TExpressionNode): string[] {
  switch (node.kind) {
    case 'operand':
      return node.operand.kind === 'chain' ? [node.operand.chain] : [];
    case 'not':
      return collectChainOperands(node.operand);
    default:
      return [
        ...collectChainOperands(node.left),
        ...collectChainOperands(node.right),
      ];
  }
}

function lintSetData(
  data: Record<string, unknown> | undefined,
  dataPath: string,
  report: TReport,
  reportUnknownRead: TReportUnknownRead
): void {
  const properties = data?.properties;
  if (!isPlainObject(properties)) {
    return;
  }
  for (const target of Object.keys(properties)) {
    const path = childPath(childPath(dataPath, 'properties'), target);
    const segments = target.split('.');
    const root = segments[0].toLowerCase().substring(1);
    if (!segments[0].startsWith('$') || !DATA_TARGETS.includes(root)) {
      report(
        'E160',
        'error',
        path,
        `setData: unrecognized target '${target}'; a target starts with $scope, $operationdata or $globaldata.`
      );
      continue;
    }
    const rest = segments.slice(1);
    const forbidden = findForbiddenSegment(rest);
    if (forbidden !== undefined) {
      report(
        'E140',
        'error',
        path,
        `setData: property chain '${target}' contains forbidden segment '${forbidden}'. Property chains may not contain __proto__, prototype or constructor.`
      );
      continue;
    }
    if (
      root === 'scope' &&
      rest.length === 1 &&
      RESERVED_SCOPE_KEYS.has(rest[0])
    ) {
      report(
        'W160',
        'warning',
        path,
        `setData: '${target}' overwrites '${rest[0]}', which the engine uses to run the action. Use $scope.variables.${rest[0]} for your own value.`
      );
    }
    if (root === 'operationdata' && rest.length > 1) {
      reportUnknownRead(target, rest[0], path);
    }
  }
}

function lintRequestAction(
  data: Record<string, unknown> | undefined,
  dataPath: string,
  context: ILintContext,
  report: TReport
): void {
  const name = data?.systemName;
  if (
    typeof name !== 'string' ||
    getParsedChain(name) !== null ||
    context.actionNames.has(name)
  ) {
    return;
  }
  const didYouMean = formatDidYouMean(
    findClosestNames(name, [...context.actionNames])
  );
  report(
    'E310',
    'error',
    childPath(dataPath, 'systemName'),
    `requestAction: there is no action named '${name}'. ${didYouMean || 'Action names come from actions[].name and eventActions[].name.'}`
  );
}

/**
 * Visits every value in the operation data, depth first, with its JSON path
 * and the top-level key it sits under.
 */
function walkData(
  data: Record<string, unknown>,
  dataPath: string,
  visit: (value: unknown, path: string, topKey: string | undefined) => void
): void {
  const visiting = new Set<object>();
  const walk = (value: unknown, path: string, topKey: string | undefined) => {
    visit(value, path, topKey);
    if (value === null || typeof value !== 'object' || visiting.has(value)) {
      return;
    }
    if (Array.isArray(value)) {
      visiting.add(value);
      value.forEach((item, index) =>
        walk(item, childPath(path, index), topKey)
      );
      visiting.delete(value);
      return;
    }
    if (!isPlainObject(value)) {
      return;
    }
    visiting.add(value);
    for (const key of Object.keys(value)) {
      walk(value[key], childPath(path, key), topKey ?? key);
    }
    visiting.delete(value);
  };
  walk(data, dataPath, undefined);
}
