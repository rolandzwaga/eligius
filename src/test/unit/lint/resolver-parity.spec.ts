import {ConfigurationResolver} from '@configuration/configuration-resolver.ts';
import type {IEngineConfiguration} from '@configuration/types.ts';
import {ActionRegistryEventbusListener, Eventbus} from '@eventbus/index.ts';
import {EligiusResourceImporter} from '@importer/eligius-resource-importer.ts';
import {lintConfiguration} from '@lint/lint-configuration.ts';
import {deepCopy} from '@operation/helper/deep-copy.ts';
import {
  createValidConfiguration,
  endableAction,
  eventAction,
  op,
  timelineAction,
} from '@test/fixtures/lint-configuration-factory.ts';
import {describe, expect, test} from 'vitest';

/**
 * Roadmap exit criterion for Phase 3: the resolver errors the linter
 * reports are identical to the runtime's for 30 invalid configurations.
 * The runtime side is the ConfigurationResolver with the default
 * EligiusResourceImporter, as EngineFactory.createEngine runs it.
 */
const invalid: [string, (configuration: IEngineConfiguration) => void][] = [
  ['misspelled operation', c => seed(c, op('selectElemen', {selector: '#a'}))],
  ['unknown operation unlike any', c => seed(c, op('zzzz'))],
  ['controller as operation', c => seed(c, op('LabelController'))],
  ['provider as operation', c => seed(c, op('RafPositionSource'))],
  [
    'misspelled operation in end operations',
    c => {
      c.timelines[0].timelineActions.push(
        timelineAction([], [op('addClas', {className: 'a'})])
      );
    },
  ],
  [
    'misspelled operation in a lookup action',
    c => {
      c.actions.push(endableAction([op('removeClas', {className: 'a'})]));
    },
  ],
  [
    'misspelled operation in an init action',
    c => {
      c.initActions.push(endableAction([], [op('setStyl')]));
    },
  ],
  [
    'misspelled operation in an event action',
    c => {
      c.eventActions?.push(eventAction([op('broadcastEven')]));
    },
  ],
  [
    'unknown positionSource override',
    c => {
      c.timelines[0].positionSource = {systemName: 'RafPositionSourc'};
    },
  ],
  [
    'positionSource override naming an operation',
    c => {
      c.timelines[0].positionSource = {systemName: 'selectElement'};
    },
  ],
  [
    'containerProvider override not an object',
    c => {
      c.timelines[0].containerProvider = 'DomContainerProvider' as any;
    },
  ],
  [
    'positionSource systemName not a string',
    c => {
      c.timelines[0].positionSource = {systemName: 5 as any};
    },
  ],
  [
    'ScrollPositionSource override without selector',
    c => {
      c.timelines[0].positionSource = {systemName: 'ScrollPositionSource'};
    },
  ],
  [
    'DomContainerProvider override with empty selector',
    c => {
      c.timelines[0].containerProvider = {
        systemName: 'DomContainerProvider',
        selector: '',
      };
    },
  ],
  [
    'VideoPositionSource override with empty sources',
    c => {
      c.timelines[0].positionSource = {
        systemName: 'VideoPositionSource',
        selector: '#v',
        sources: [],
      } as any;
    },
  ],
  [
    'timeline type without provider settings',
    c => {
      c.timelines[0].type = 'mediaplayer';
    },
  ],
  [
    'override without systemName and no type settings',
    c => {
      c.timelines[0].type = 'mediaplayer';
      c.timelines[0].positionSource = {selector: '#v'} as any;
    },
  ],
  [
    'no timelineProviderSettings and no own position source',
    c => {
      delete c.timelineProviderSettings;
    },
  ],
  [
    'VideoPositionSource options in type settings',
    c => {
      c.timelineProviderSettings = {
        ...c.timelineProviderSettings,
        mediaplayer: {
          positionSource: {
            systemName: 'VideoPositionSource',
            selector: '#v',
            sources: [{src: 'a', type: 'b'}],
            options: {},
          } as any,
        },
      };
    },
  ],
  [
    'VideoPositionSource options in an override',
    c => {
      c.timelines[0].positionSource = {
        systemName: 'VideoPositionSource',
        selector: '#v',
        sources: [{src: 'a', type: 'b'}],
        options: {},
      } as any;
    },
  ],
  [
    'duration not an object',
    c => {
      c.timelines[0].timelineActions.push({
        ...timelineAction([]),
        duration: 'x' as any,
      });
    },
  ],
  [
    'negative duration start',
    c => {
      c.timelines[0].timelineActions.push({
        ...timelineAction([]),
        duration: {start: -1},
      });
    },
  ],
  [
    'duration end before start',
    c => {
      c.timelines[0].timelineActions.push({
        ...timelineAction([]),
        duration: {start: 2, end: 1},
      });
    },
  ],
  [
    'duration end not a number',
    c => {
      c.timelines[0].timelineActions.push({
        ...timelineAction([]),
        duration: {start: 0, end: 'x' as any},
      });
    },
  ],
  [
    'startOperations not an array',
    c => {
      c.timelines[0].timelineActions.push({
        ...timelineAction([]),
        startOperations: 'x' as any,
      });
    },
  ],
  [
    'endOperations not an array',
    c => {
      c.timelines[0].timelineActions.push({
        ...timelineAction([]),
        endOperations: null as any,
      });
    },
  ],
  [
    'timelineActions not an array',
    c => {
      c.timelines[0].timelineActions = {} as any;
    },
  ],
  [
    'timelines not an array',
    c => {
      c.timelines = 'x' as any;
    },
  ],
  [
    'actions not an array',
    c => {
      c.actions = 1 as any;
    },
  ],
  [
    'initActions not an array',
    c => {
      c.initActions = undefined as any;
    },
  ],
  [
    'eventActions not an array',
    c => {
      c.eventActions = {} as any;
    },
  ],
  [
    'duplicate action names',
    c => {
      c.actions.push(
        endableAction([], [], 'Same'),
        endableAction([], [], 'Same')
      );
    },
  ],
  [
    'config: placeholder without a target',
    c => {
      c.containerSelector = 'config:engine.missing';
    },
  ],
  [
    'circular config: placeholders',
    c => {
      c.containerSelector = 'config:layoutTemplate';
      c.layoutTemplate = 'config:containerSelector';
    },
  ],
  [
    'config: placeholder with a forbidden segment',
    c => {
      c.containerSelector = 'config:engine.__proto__.x';
    },
  ],
];

function seed(
  configuration: IEngineConfiguration,
  ...operations: ReturnType<typeof op>[]
) {
  configuration.timelines[0].timelineActions.push(timelineAction(operations));
}

function runtimeError(configuration: IEngineConfiguration): string {
  try {
    new ConfigurationResolver(new EligiusResourceImporter(), new Eventbus(), {
      onWarning: () => {},
    }).process(deepCopy(configuration), new ActionRegistryEventbusListener());
  } catch (error) {
    return (error as Error).message;
  }
  throw new Error('expected the resolver to throw');
}

describe('lint and runtime resolver parity', () => {
  test('there are at least 30 invalid configurations', () => {
    expect(invalid.length).toBeGreaterThanOrEqual(30);
  });

  test.each(invalid)(
    'given %s, when linted and resolved at runtime, then the E001 message is the runtime error',
    (_name, mutate) => {
      const configuration = createValidConfiguration();
      mutate(configuration);

      const diagnostics = lintConfiguration(configuration);
      const resolverDiagnostics = diagnostics.filter(d => d.code === 'E001');

      expect(resolverDiagnostics).toHaveLength(1);
      expect(resolverDiagnostics[0].message).toBe(runtimeError(configuration));
      expect(resolverDiagnostics[0].path).not.toBe('');
      expect(resolverDiagnostics[0].message).toContain(
        resolverDiagnostics[0].path
      );
    }
  );
});
