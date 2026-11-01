// The benchmark imports the built package (dist/, through the package name)
// instead of src/. Vite's module runner wraps every export of a transformed
// module in a getter, and the interpreter calls helpers across modules
// thousands of times per run; the built output has no internal getters. The
// bench script builds first. See
// https://vitest.dev/guide/benchmarking#module-runner-overhead
import {
  Action,
  addClass,
  ConfigurationFactory,
  ConfigurationResolver,
  EligiusResourceImporter,
  Eventbus,
  endForEach,
  endWhen,
  forEach,
  type IEngineConfiguration,
  type IEventbus,
  type IOperationScope,
  type IResolvedOperation,
  otherwise,
  removeClass,
  selectElement,
  setData,
  setOperationData,
  type TOperation,
  type TOperationData,
  when,
} from 'eligius';
import $ from 'jquery';
import {describe, test} from 'vitest';

/**
 * Action execution overhead: the Phase 0 baseline of specs/007-aot-compiler.
 *
 * Every scenario runs one action in three ways:
 *
 * - interpreted: the real `Action` class executes the resolved operations.
 * - direct-call ceiling: hand-written structured control flow (`if`, `for`)
 *   that calls the same operation functions with real scope objects. This is
 *   the upper bound for generated code that keeps the operations as they are.
 * - hand-written jQuery: the same DOM work without operations at all.
 *
 * The last block measures the one-time ConfigurationResolver cost against
 * constructing resolved actions directly, which is what a generated module
 * would do.
 *
 * Run with `npm run bench`. Numbers are recorded in
 * specs/007-aot-compiler/measurements.md.
 */

type TAnyOperation = TOperation<any, any>;
type TOperationSpec = [
  systemName: string,
  instance: TAnyOperation,
  operationData: TOperationData,
];

interface IScenario {
  name: string;
  when: boolean;
  loop: number;
}

const SCENARIOS: IScenario[] = [
  {
    name: 'full action: 13 ops, when/otherwise, forEach over 20',
    when: true,
    loop: 20,
  },
  {name: 'no forEach: 9 ops with when/otherwise', when: true, loop: 0},
  {name: 'no when: 8 ops with forEach over 20', when: false, loop: 20},
  {name: 'large loop: 13 ops, forEach over 200', when: true, loop: 200},
];

const BENCH_OPTIONS = {time: 1000, warmupTime: 200};
const TEST_TIMEOUT = 120_000;

// Local references: the hot closures below must not go through the module
// runner's export getters on every call.
const ops = {
  selectElement,
  addClass,
  removeClass,
  setData,
  when,
  otherwise,
  endWhen,
  forEach,
  setOperationData,
  endForEach,
} satisfies Record<string, TAnyOperation>;
const ActionClass = Action;
const ResolverClass = ConfigurationResolver;

function createItems(count: number): string[] {
  return Array.from({length: count}, (_, index) => `item-${index}`);
}

/**
 * The operation list of the benchmark action, in the order the interpreter
 * runs it. The `when` block and the `forEach` block are optional so that the
 * scenarios can isolate their cost.
 */
function buildOperations(scenario: IScenario): TOperationSpec[] {
  const operations: TOperationSpec[] = [
    ['selectElement', ops.selectElement, {selector: '.bench-target'}],
    ['addClass', ops.addClass, {className: 'active'}],
    [
      'setData',
      ops.setData,
      {
        properties: {
          '$operationdata.count': 3,
          '$operationdata.items': createItems(scenario.loop),
        },
      },
    ],
  ];
  if (scenario.when) {
    operations.push(
      ['when', ops.when, {expression: '$operationdata.count>2'}],
      ['removeClass', ops.removeClass, {className: 'hidden'}],
      ['otherwise', ops.otherwise, {}],
      ['addClass', ops.addClass, {className: 'hidden'}],
      ['endWhen', ops.endWhen, {}]
    );
  }
  if (scenario.loop > 0) {
    operations.push(
      ['forEach', ops.forEach, {collection: '$operationdata.items'}],
      [
        'setOperationData',
        ops.setOperationData,
        {properties: {label: '$scope.currentItem'}},
      ],
      [
        'setData',
        ops.setData,
        {properties: {'$operationdata.last': '$operationdata.label'}},
      ],
      ['endForEach', ops.endForEach, {}]
    );
  }
  operations.push(['removeClass', ops.removeClass, {className: 'active'}]);
  return operations;
}

function toResolvedOperations(specs: TOperationSpec[]): IResolvedOperation[] {
  return specs.map(([systemName, instance, operationData], index) => ({
    id: `op-${index}`,
    systemName,
    operationData,
    instance,
  }));
}

function mountDom() {
  const root = $(
    '<div class="bench-root"><div class="bench-target"></div></div>'
  ).appendTo(document.body);
  return {root, target: root.find('.bench-target')};
}

function createEventbus(root: JQuery): IEventbus {
  const eventbus = new Eventbus();
  eventbus.onRequest('request-engine-root', () => root);
  return eventbus;
}

/**
 * A child scope with the same shape as the one `Action` pushes for `when`
 * and `forEach` blocks.
 */
function createChildScope(parent: IOperationScope): IOperationScope {
  return {
    get currentIndex() {
      return parent.currentIndex;
    },
    set currentIndex(value: number) {
      parent.currentIndex = value;
    },
    get eventbus() {
      return parent.eventbus;
    },
    get operations() {
      return parent.operations;
    },
    parent,
  };
}

/**
 * What a generated module could emit for the benchmark action without
 * touching the operations: fresh configured literals per run, the real
 * operation functions, real scope objects, and `if`/`for` instead of the
 * `when`/`forEach` operations. `currentIndex` follows the operation list so
 * that error messages stay identical.
 */
function createDirectCallCeiling(
  scenario: IScenario,
  operations: IResolvedOperation[],
  eventbus: IEventbus
): () => TOperationData {
  const items = createItems(scenario.loop);
  const call = (
    scope: IOperationScope,
    index: number,
    operation: TAnyOperation,
    data: TOperationData,
    configured: TOperationData
  ): TOperationData => {
    scope.currentIndex = index;
    return operation.call(scope, Object.assign(data, configured));
  };

  return () => {
    const root: IOperationScope = {currentIndex: -1, eventbus, operations};
    let data: TOperationData = {};
    data = call(root, 0, ops.selectElement, data, {selector: '.bench-target'});
    data = call(root, 1, ops.addClass, data, {className: 'active'});
    data = call(root, 2, ops.setData, data, {
      properties: {
        '$operationdata.count': 3,
        '$operationdata.items': items.slice(),
      },
    });
    let next = 3;
    if (scenario.when) {
      const scope = createChildScope(root);
      if (data.count > 2) {
        data = call(scope, 4, ops.removeClass, data, {className: 'hidden'});
      } else {
        data = call(scope, 6, ops.addClass, data, {className: 'hidden'});
      }
      next = 8;
    }
    if (scenario.loop > 0) {
      const scope = createChildScope(root);
      const collection = (data.items as unknown[]).slice();
      scope.loopStartIndex = next;
      scope.loopEndIndex = next + 3;
      scope.loopLength = collection.length - 1;
      for (let index = 0; index < collection.length; index++) {
        scope.loopIndex = index;
        scope.currentItem = collection[index];
        data = call(scope, next + 1, ops.setOperationData, data, {
          properties: {label: '$scope.currentItem'},
        });
        data = call(scope, next + 2, ops.setData, data, {
          properties: {'$operationdata.last': '$operationdata.label'},
        });
      }
      next += 4;
    }
    data = call(root, next, ops.removeClass, data, {className: 'active'});
    return data;
  };
}

/** The same DOM work and data flow without operations. */
function createHandwritten(
  scenario: IScenario,
  root: JQuery
): () => TOperationData {
  const items = createItems(scenario.loop);
  return () => {
    const target = root.find('.bench-target');
    target.addClass('active');
    let data: TOperationData = {
      selectedElement: target,
      count: 3,
      items: items.slice(),
    };
    if (scenario.when) {
      if (data.count > 2) {
        target.removeClass('hidden');
      } else {
        target.addClass('hidden');
      }
    }
    if (scenario.loop > 0) {
      for (const item of data.items as string[]) {
        data = {...data, label: item};
        data.last = data.label;
      }
    }
    target.removeClass('active');
    return data;
  };
}

describe('action execution overhead', () => {
  for (const scenario of SCENARIOS) {
    test(scenario.name, {timeout: TEST_TIMEOUT}, async ({bench}) => {
      const {root} = mountDom();
      const eventbus = createEventbus(root);
      const operations = toResolvedOperations(buildOperations(scenario));
      const action = new ActionClass('bench', operations, eventbus);
      const ceiling = createDirectCallCeiling(scenario, operations, eventbus);
      const handwritten = createHandwritten(scenario, root);

      await bench.compare(
        bench('interpreted (Action)', () => action.start()),
        bench('direct-call ceiling', () => {
          ceiling();
        }),
        bench('hand-written jQuery', () => {
          handwritten();
        }),
        BENCH_OPTIONS
      );

      root.remove();
    });
  }
});

const ACTION_COUNT = 10;

function buildConfiguration(): IEngineConfiguration {
  const factory = new ConfigurationFactory();
  factory
    .init('en-US')
    .setContainerSelector('.bench-root')
    .addTimeline('main', 'animation', 60, false, '.bench-root');
  factory
    .editTimelineProviderSettings()
    .addProvider('animation')
    .setContainer('.bench-root');
  const specs = buildOperations(SCENARIOS[0]);
  for (let index = 0; index < ACTION_COUNT; index++) {
    const creator = factory
      .createTimelineAction('main', `Action${index}`)
      .addDuration(index, index + 1);
    for (const [systemName, , operationData] of specs) {
      creator.addStartOperation(systemName as any, operationData as any).next();
    }
  }
  const configuration = factory.getConfiguration();
  const actions = configuration.timelines[0]?.timelineActions ?? [];
  const operationCount = actions.reduce(
    (sum, action) => sum + action.startOperations.length,
    0
  );
  if (actions.length !== ACTION_COUNT || operationCount !== ACTION_COUNT * 13) {
    throw new Error(
      `benchmark configuration has ${actions.length} actions and ${operationCount} operations`
    );
  }
  return configuration;
}

describe('configuration resolution (one-time startup cost)', () => {
  test(`resolver vs direct construction, ${ACTION_COUNT} actions x 13 operations`, {
    timeout: TEST_TIMEOUT,
  }, async ({bench}) => {
    const {root} = mountDom();
    const eventbus = createEventbus(root);
    const configuration = buildConfiguration();
    const importer = new EligiusResourceImporter();
    const lookup: Record<string, TAnyOperation> = ops;

    await bench.compare(
      bench('structuredClone(config) alone', () => {
        structuredClone(configuration);
      }),
      bench('ConfigurationResolver.process (includes the clone)', () => {
        const resolver = new ResolverClass(importer, eventbus);
        resolver.process(structuredClone(configuration));
      }),
      bench('direct Action construction (what a generated module does)', () => {
        const timeline = configuration.timelines[0];
        for (const actionConfig of timeline.timelineActions) {
          new ActionClass(
            actionConfig.name,
            actionConfig.startOperations.map(operation => ({
              id: operation.id,
              systemName: operation.systemName,
              operationData: operation.operationData ?? {},
              instance: lookup[operation.systemName],
            })),
            eventbus
          );
        }
      }),
      BENCH_OPTIONS
    );

    root.remove();
  });
});
