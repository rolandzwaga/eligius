import {ConfigurationResolver} from '@configuration/configuration-resolver.ts';
import {ActionRegistryEventbusListener} from '@eventbus/actionregistry-eventbus-listener.ts';
import {Eventbus} from '@eventbus/eventbus.ts';
import {EligiusResourceImporter} from '@importer/eligius-resource-importer.ts';
import {
  endableAction,
  op,
  withTimelineAction,
} from '@test/fixtures/lint-configuration-factory.ts';
import {describe, expect, test, vi} from 'vitest';
import type {IConfigurationWarning} from '@/types.ts';

function resolve(
  configuration: ReturnType<typeof withTimelineAction>,
  onWarning?: (warning: IConfigurationWarning) => void
) {
  return new ConfigurationResolver(
    new EligiusResourceImporter(),
    new Eventbus(),
    onWarning ? {onWarning} : undefined
  ).process(configuration, new ActionRegistryEventbusListener());
}

describe('ConfigurationResolver structural warnings', () => {
  test('given well-formed blocks, when processed, then no warning is reported', () => {
    const onWarning = vi.fn();
    resolve(
      withTimelineAction([
        op('forEach', {collection: [1]}),
        op('when', {expression: 'true'}),
        op('breakForEach'),
        op('otherwise'),
        op('endWhen'),
        op('endForEach'),
      ]),
      onWarning
    );
    expect(onWarning).not.toHaveBeenCalled();
  });

  test('given an endWhen without a when, when processed, then onWarning receives the path and the message and the configuration still resolves', () => {
    const onWarning = vi.fn();
    const [, resolved] = resolve(
      withTimelineAction([
        op('selectElement', {selector: '#a'}),
        op('endWhen'),
      ]),
      onWarning
    );

    expect(resolved.timelines[0].timelineActions).toHaveLength(1);
    expect(onWarning).toHaveBeenCalledTimes(1);
    expect(onWarning).toHaveBeenCalledWith({
      path: 'timelines[0].timelineActions[0].startOperations[1].systemName',
      message:
        'endWhen at index 1 has no open when to close. This will be a configuration error in the next major version.',
    });
  });

  test('given the pinned crossing shape, when processed, then the crossing is warned about', () => {
    const onWarning = vi.fn();
    resolve(
      withTimelineAction([
        op('when', {expression: 'false'}),
        op('forEach', {collection: [1, 2]}),
        op('otherwise'),
        op('endForEach'),
        op('endWhen'),
      ]),
      onWarning
    );
    expect(onWarning.mock.calls.map(([warning]) => warning.path)).toEqual([
      'timelines[0].timelineActions[0].startOperations[2].systemName',
    ]);
  });

  test('given problems in end operations, lookup actions, init actions and event actions, when processed, then each is reported with its own path', () => {
    const onWarning = vi.fn();
    const configuration = withTimelineAction([], [op('endForEach')]);
    configuration.actions.push(
      endableAction([op('when', {expression: 'true'})])
    );
    configuration.initActions.push(endableAction([], [op('otherwise')]));
    configuration.eventActions?.push({
      id: 'ev',
      name: 'OnEvent',
      eventName: 'x',
      startOperations: [op('breakForEach')],
    });
    resolve(configuration, onWarning);
    expect(onWarning.mock.calls.map(([warning]) => warning.path)).toEqual([
      'actions[0].startOperations[0].systemName',
      'initActions[0].endOperations[0].systemName',
      'timelines[0].timelineActions[0].endOperations[0].systemName',
      'eventActions[0].startOperations[0].systemName',
    ]);
  });

  test('given no onWarning option, when a problem is found, then it is written with console.warn', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    resolve(withTimelineAction([op('endWhen')]));
    expect(warn).toHaveBeenCalledWith(
      'Eligius configuration warning at timelines[0].timelineActions[0].startOperations[0].systemName: endWhen at index 0 has no open when to close. This will be a configuration error in the next major version.'
    );
  });
});
