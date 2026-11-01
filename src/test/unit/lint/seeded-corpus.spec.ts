import type {IEngineConfiguration} from '@configuration/types.ts';
import {lintConfiguration} from '@lint/lint-configuration.ts';
import {
  createValidConfiguration,
  endableAction,
  eventAction,
  FIRST_START_OPERATIONS as OPS,
  op,
  FIRST_TIMELINE_ACTION as TA,
  timelineAction,
} from '@test/fixtures/lint-configuration-factory.ts';
import {describe, expect, test} from 'vitest';

/**
 * Roadmap exit criterion for Phase 3 (specs/007-aot-compiler/roadmap.md):
 * a seeded-error corpus of 40 configurations produces the expected codes and
 * paths. Every case starts from the valid configuration and plants one
 * error; the expected diagnostic must be among the reported ones.
 */
interface ISeededCase {
  name: string;
  seed: (configuration: IEngineConfiguration) => void;
  code: string;
  path: string;
}

const seedTimelineAction =
  (...operations: ReturnType<typeof op>[]) =>
  (configuration: IEngineConfiguration) => {
    configuration.timelines[0].timelineActions.push(timelineAction(operations));
  };

const corpus: ISeededCase[] = [
  // Resolver errors (E001)
  {
    name: 'misspelled operation',
    seed: seedTimelineAction(op('selectElemen', {selector: '#a'})),
    code: 'E001',
    path: `${OPS}[0].systemName`,
  },
  {
    name: 'controller used as operation',
    seed: seedTimelineAction(op('LabelController')),
    code: 'E001',
    path: `${OPS}[0].systemName`,
  },
  {
    name: 'provider used as operation',
    seed: seedTimelineAction(op('RafPositionSource')),
    code: 'E001',
    path: `${OPS}[0].systemName`,
  },
  {
    name: 'unknown positionSource override',
    seed: c => {
      c.timelines[0].positionSource = {systemName: 'RafPositionSourc'};
    },
    code: 'E001',
    path: 'timelines[0].positionSource.systemName',
  },
  {
    name: 'containerProvider override that is not an object',
    seed: c => {
      c.timelines[0].containerProvider = 'DomContainerProvider' as any;
    },
    code: 'E001',
    path: 'timelines[0].containerProvider',
  },
  {
    name: 'ScrollPositionSource override without selector',
    seed: c => {
      c.timelines[0].positionSource = {systemName: 'ScrollPositionSource'};
    },
    code: 'E001',
    path: 'timelines[0].positionSource.selector',
  },
  {
    name: 'timeline type without provider settings',
    seed: c => {
      c.timelines[0].type = 'mediaplayer';
    },
    code: 'E001',
    path: 'timelineProviderSettings.mediaplayer',
  },
  {
    name: 'duration that is not an object',
    seed: c => {
      c.timelines[0].timelineActions.push({
        ...timelineAction([]),
        duration: 5 as any,
      });
    },
    code: 'E001',
    path: `${TA}.duration`,
  },
  {
    name: 'negative duration start',
    seed: c => {
      c.timelines[0].timelineActions.push({
        ...timelineAction([]),
        duration: {start: -1, end: 2},
      });
    },
    code: 'E001',
    path: `${TA}.duration.start`,
  },
  {
    name: 'duration end before start',
    seed: c => {
      c.timelines[0].timelineActions.push({
        ...timelineAction([]),
        duration: {start: 3, end: 2},
      });
    },
    code: 'E001',
    path: `${TA}.duration.end`,
  },
  {
    name: 'startOperations that is not an array',
    seed: c => {
      c.timelines[0].timelineActions.push({
        ...timelineAction([]),
        startOperations: {} as any,
      });
    },
    code: 'E001',
    path: `${TA}.startOperations`,
  },
  {
    name: 'timelineActions that is not an array',
    seed: c => {
      c.timelines[0].timelineActions = null as any;
    },
    code: 'E001',
    path: 'timelines[0].timelineActions',
  },
  {
    name: 'actions that is not an array',
    seed: c => {
      c.actions = 'none' as any;
    },
    code: 'E001',
    path: 'actions',
  },
  {
    name: 'initActions that is not an array',
    seed: c => {
      c.initActions = {} as any;
    },
    code: 'E001',
    path: 'initActions',
  },
  {
    name: 'duplicate action name',
    seed: c => {
      c.actions.push(endableAction([], [], 'Same'));
      c.eventActions?.push(eventAction([], 'x', 'Same'));
    },
    code: 'E001',
    path: 'actions[0].name',
  },
  {
    name: 'VideoPositionSource with options',
    seed: c => {
      c.timelineProviderSettings = {
        ...c.timelineProviderSettings,
        mediaplayer: {
          positionSource: {
            systemName: 'VideoPositionSource',
            selector: '#v',
            sources: [{src: 'a.mp4', type: 'video/mp4'}],
            options: {},
          } as any,
        },
      };
    },
    code: 'E001',
    path: 'timelineProviderSettings.mediaplayer.positionSource.options',
  },
  {
    name: 'config: placeholder without a target',
    seed: c => {
      c.containerSelector = 'config:engine.missing';
    },
    code: 'E001',
    path: 'containerSelector',
  },
  {
    name: 'circular config: placeholders',
    seed: c => {
      c.containerSelector = 'config:layoutTemplate';
      c.layoutTemplate = 'config:containerSelector';
    },
    code: 'E001',
    path: 'containerSelector',
  },
  {
    name: 'unknown template with a templates option',
    seed: c => {
      c.layoutTemplate = 'template:layot';
      (c as any).__options = {templates: ['layout']};
    },
    code: 'E001',
    path: 'layoutTemplate',
  },
  {
    name: 'unknown json with a json option',
    seed: c => {
      c.timelines[0].timelineActions.push(
        timelineAction([
          op('setOperationData', {properties: {data: 'json:setings'}}),
        ])
      );
      (c as any).__options = {json: {settings: {}}};
    },
    code: 'E001',
    path: `${OPS}[0].operationData.properties.data`,
  },
  // Control flow (E101)
  {
    name: 'endWhen without when',
    seed: seedTimelineAction(op('endWhen')),
    code: 'E101',
    path: `${OPS}[0].systemName`,
  },
  {
    name: 'endWhen closing a forEach',
    seed: seedTimelineAction(op('forEach', {collection: [1]}), op('endWhen')),
    code: 'E101',
    path: `${OPS}[1].systemName`,
  },
  {
    name: 'forEach never closed',
    seed: seedTimelineAction(op('forEach', {collection: [1]}), op('log')),
    code: 'E101',
    path: `${OPS}[0].systemName`,
  },
  {
    name: 'breakForEach outside a forEach',
    seed: seedTimelineAction(op('breakForEach')),
    code: 'E101',
    path: `${OPS}[0].systemName`,
  },
  {
    name: 'otherwise without when',
    seed: seedTimelineAction(op('otherwise')),
    code: 'E101',
    path: `${OPS}[0].systemName`,
  },
  // Required properties
  {
    name: 'selectElement without selector',
    seed: seedTimelineAction(op('selectElement')),
    code: 'E111',
    path: `${OPS}[0].operationData`,
  },
  {
    name: 'addClass without className in an init action',
    seed: c => {
      c.initActions.push(
        endableAction([op('selectElement', {selector: '#a'}), op('addClass')])
      );
    },
    code: 'E111',
    path: 'initActions[0].startOperations[1].operationData',
  },
  {
    name: 'selectElement without selector in a lookup action',
    seed: c => {
      c.actions.push(endableAction([op('selectElement')]));
    },
    code: 'W111',
    path: 'actions[0].startOperations[0].operationData',
  },
  // Literal unions, expressions, chains
  {
    name: 'calc operator outside the union',
    seed: seedTimelineAction(op('calc', {left: 1, right: 2, operator: '^'})),
    code: 'E120',
    path: `${OPS}[0].operationData.operator`,
  },
  {
    name: 'when expression that does not parse',
    seed: seedTimelineAction(op('when', {expression: '(1==1'}), op('endWhen')),
    code: 'E130',
    path: `${OPS}[0].operationData.expression`,
  },
  {
    name: 'when expression with an unknown operand',
    seed: seedTimelineAction(
      op('when', {expression: '$operationData.a==foo'}),
      op('endWhen')
    ),
    code: 'E131',
    path: `${OPS}[0].operationData.expression`,
  },
  {
    name: 'forbidden segment in a chain value',
    seed: seedTimelineAction(
      op('setOperationData', {properties: {a: '$operationdata.__proto__.x'}})
    ),
    code: 'E140',
    path: `${OPS}[0].operationData.properties.a`,
  },
  {
    name: 'forbidden segment in a setData target',
    seed: seedTimelineAction(
      op('setData', {properties: {'$scope.constructor.x': 1}})
    ),
    code: 'E140',
    path: `${OPS}[0].operationData.properties['$scope.constructor.x']`,
  },
  {
    name: 'forbidden segment in a when operand',
    seed: seedTimelineAction(
      op('when', {expression: '$globaldata.prototype.a==1'}),
      op('endWhen')
    ),
    code: 'E140',
    path: `${OPS}[0].operationData.expression`,
  },
  {
    name: '__proto__ key in operation data',
    seed: seedTimelineAction(
      op(
        'setOperationData',
        JSON.parse('{"properties": {"__proto__": {"x": 1}}}')
      )
    ),
    code: 'E141',
    path: `${OPS}[0].operationData.properties.__proto__`,
  },
  {
    name: 'unrecognized setData target',
    seed: seedTimelineAction(op('setData', {properties: {'$foo.bar': 1}})),
    code: 'E160',
    path: `${OPS}[0].operationData.properties['$foo.bar']`,
  },
  {
    name: 'requestAction with an unknown name',
    seed: c => {
      c.actions.push(endableAction([], [], 'ShowTitle'));
      c.timelines[0].timelineActions.push(
        timelineAction([op('requestAction', {systemName: 'ShowTitel'})])
      );
    },
    code: 'E310',
    path: `${OPS}[0].operationData.systemName`,
  },
  // Warnings
  {
    name: 'addClass without a selected element',
    seed: seedTimelineAction(op('addClass', {className: 'a'})),
    code: 'W110',
    path: `${OPS}[0]`,
  },
  {
    name: 'chain in a field addClass does not resolve',
    seed: seedTimelineAction(
      op('selectElement', {selector: '#a'}),
      op('addClass', {className: '$globaldata.cls'})
    ),
    code: 'W150',
    path: `${OPS}[1].operationData.className`,
  },
  {
    name: 'read of a property nothing provides',
    seed: seedTimelineAction(
      op('setOperationData', {properties: {a: '$operationdata.missing'}})
    ),
    code: 'W151',
    path: `${OPS}[0].operationData.properties.a`,
  },
  {
    name: 'setData writing a reserved scope field',
    seed: seedTimelineAction(
      op('setData', {properties: {'$scope.operations': []}})
    ),
    code: 'W160',
    path: `${OPS}[0].operationData.properties['$scope.operations']`,
  },
];

describe('seeded error corpus', () => {
  test('the corpus has at least 40 cases', () => {
    expect(corpus.length).toBeGreaterThanOrEqual(40);
  });

  test('given the valid base configuration, when linted, then nothing is reported', () => {
    expect(lintConfiguration(createValidConfiguration())).toEqual([]);
  });

  test.each(corpus.map(entry => [entry.name, entry] as const))(
    'given %s, when linted, then the expected code is reported at the expected path',
    (_name, entry) => {
      const configuration = createValidConfiguration();
      entry.seed(configuration);
      const options = (configuration as any).__options;
      delete (configuration as any).__options;

      const diagnostics = lintConfiguration(configuration, options);

      expect(
        diagnostics.map(d => ({code: d.code, path: d.path}))
      ).toContainEqual({
        code: entry.code,
        path: entry.path,
      });
    }
  );
});
