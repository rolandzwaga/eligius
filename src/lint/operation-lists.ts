import type {
  IEngineConfiguration,
  IOperationConfiguration,
} from '@configuration/types.ts';
import type {TOperationData} from '@operation/types.ts';
import {isPlainObject} from '@util/guards/is-plain-object.ts';

/**
 * One list of operations of a configuration, with its JSON path.
 */
export interface IOperationList {
  operations: readonly unknown[];
  /** For example `timelines[0].timelineActions[1].startOperations` */
  path: string;
  /**
   * True when the engine starts the list with an empty operation data
   * object: the start and end operations of timeline actions and init
   * actions. Lookup actions (`actions`) receive the caller's data through
   * `startAction` and `endAction`, and event actions start with the event's
   * `eventArgs`, so their initial data is not known.
   */
  startsEmpty: boolean;
}

/**
 * True when `value` is shaped like an operation configuration: a plain
 * object with a string `systemName`.
 */
export function isOperationConfiguration(
  value: unknown
): value is IOperationConfiguration<TOperationData> {
  return isPlainObject(value) && typeof value.systemName === 'string';
}

/**
 * Collects every operation list of the configuration in document order.
 * Values that are not arrays are skipped; the resolver reports those.
 */
export function collectOperationLists(
  configuration: IEngineConfiguration
): IOperationList[] {
  const lists: IOperationList[] = [];
  const add = (
    owner: unknown,
    path: string,
    key: 'startOperations' | 'endOperations',
    startsEmpty: boolean
  ) => {
    if (isPlainObject(owner) && Array.isArray(owner[key])) {
      lists.push({
        operations: owner[key] as unknown[],
        path: `${path}.${key}`,
        startsEmpty,
      });
    }
  };
  const addEndable = (
    owner: unknown,
    path: string,
    startsEmpty: boolean,
    withEnd: boolean
  ) => {
    add(owner, path, 'startOperations', startsEmpty);
    if (withEnd) {
      add(owner, path, 'endOperations', startsEmpty);
    }
  };
  const each = (
    items: unknown,
    path: string,
    visit: (item: unknown, itemPath: string) => void
  ) => {
    if (Array.isArray(items)) {
      items.forEach((item, index) => visit(item, `${path}[${index}]`));
    }
  };

  each(configuration.initActions, 'initActions', (action, path) =>
    addEndable(action, path, true, true)
  );
  each(configuration.actions, 'actions', (action, path) =>
    addEndable(action, path, false, true)
  );
  each(configuration.eventActions, 'eventActions', (action, path) =>
    addEndable(action, path, false, false)
  );
  each(configuration.timelines, 'timelines', (timeline, path) => {
    if (isPlainObject(timeline)) {
      each(timeline.timelineActions, `${path}.timelineActions`, (action, p) =>
        addEndable(action, p, true, true)
      );
    }
  });
  return lists;
}
