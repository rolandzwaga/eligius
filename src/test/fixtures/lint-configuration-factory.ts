import type {
  IEndableActionConfiguration,
  IEngineConfiguration,
  IEventActionConfiguration,
  IOperationConfiguration,
  ITimelineActionConfiguration,
} from '@configuration/types.ts';
import type {TOperationData} from '@operation/types.ts';

let counter = 0;

/**
 * A configuration that `lintConfiguration` and the `ConfigurationResolver`
 * with an `EligiusResourceImporter` both accept: one animation timeline on a
 * RafPositionSource, no actions.
 */
export function createValidConfiguration(): IEngineConfiguration {
  return {
    id: 'lint-test',
    engine: {systemName: 'EligiusEngine'},
    containerSelector: '#app',
    cssFiles: [],
    language: 'en-US',
    layoutTemplate: '<div id="stage"></div>',
    availableLanguages: [],
    timelineProviderSettings: {
      animation: {
        positionSource: {systemName: 'RafPositionSource'},
        container: {systemName: 'DomContainerProvider', selector: '#app'},
      },
    },
    initActions: [],
    actions: [],
    eventActions: [],
    timelines: [
      {
        id: 'timeline-1',
        uri: 'main',
        type: 'animation',
        duration: 10,
        loop: false,
        selector: '#app',
        timelineActions: [],
      },
    ],
  };
}

export function op(
  systemName: string,
  operationData?: TOperationData
): IOperationConfiguration<TOperationData> {
  counter++;
  return {
    id: `${systemName}-${counter}`,
    systemName,
    ...(operationData !== undefined && {operationData}),
  };
}

export function timelineAction(
  startOperations: IOperationConfiguration<TOperationData>[],
  endOperations: IOperationConfiguration<TOperationData>[] = [],
  name = `TimelineAction${++counter}`
): ITimelineActionConfiguration {
  return {
    id: `${name}-id`,
    name,
    duration: {start: 0, end: 1},
    startOperations,
    endOperations,
  };
}

export function endableAction(
  startOperations: IOperationConfiguration<TOperationData>[],
  endOperations: IOperationConfiguration<TOperationData>[] = [],
  name = `Action${++counter}`
): IEndableActionConfiguration {
  return {id: `${name}-id`, name, startOperations, endOperations};
}

export function eventAction(
  startOperations: IOperationConfiguration<TOperationData>[],
  eventName = 'some-event',
  name = `EventAction${++counter}`
): IEventActionConfiguration {
  return {id: `${name}-id`, name, eventName, startOperations};
}

/**
 * A valid configuration whose first timeline has one timeline action with
 * the given operations.
 */
export function withTimelineAction(
  startOperations: IOperationConfiguration<TOperationData>[],
  endOperations: IOperationConfiguration<TOperationData>[] = []
): IEngineConfiguration {
  const configuration = createValidConfiguration();
  configuration.timelines[0].timelineActions.push(
    timelineAction(startOperations, endOperations)
  );
  return configuration;
}

/** JSON path of the first timeline action of {@link withTimelineAction} */
export const FIRST_TIMELINE_ACTION = 'timelines[0].timelineActions[0]';
export const FIRST_START_OPERATIONS = `${FIRST_TIMELINE_ACTION}.startOperations`;
