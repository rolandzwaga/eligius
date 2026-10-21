// @vitest-environment node
import {requestVideoUrl} from '@eventbus/events/metadata/index.ts';
import {Project} from 'ts-morph';
import {describe, expect, test} from 'vitest';
import {
  formatEventArgMetadata,
  getEventArgMetadata,
} from '@/tools/code-generator/event-arg-metadata.ts';

const project = new Project({useInMemoryFileSystem: true});
let fileIndex = 0;

function getInterface(source: string) {
  return project
    .createSourceFile(`event${fileIndex++}.ts`, source)
    .getInterfaceOrThrow('ITestEvent');
}

describe('getEventArgMetadata', () => {
  test('given request-video-url style args with optional labels and @param docs, when read, then the optional args are flagged and every arg has its description', () => {
    // given
    const iface = getInterface(`
      /**
       * Event: request-video-url
       * @param videoUrlIndex - The index of the video URL
       * @param requestedVideoPosition - Optional video position to seek to
       * @param fromRouting - Optional flag indicating if request came from routing
       */
      export interface ITestEvent {
        name: 'request-video-url';
        args: [videoUrlIndex: number, requestedVideoPosition?: number, fromRouting?: boolean];
      }`);

    // test
    const args = getEventArgMetadata(iface);

    // expect
    expect(args).toEqual([
      {
        name: 'videoUrlIndex',
        type: 'number',
        description: 'The index of the video URL',
      },
      {
        name: 'requestedVideoPosition',
        type: 'number',
        description: 'Optional video position to seek to',
        optional: true,
      },
      {
        name: 'fromRouting',
        type: 'boolean',
        description: 'Optional flag indicating if request came from routing',
        optional: true,
      },
    ]);
  });

  test('given unlabeled tuple elements, when read, then they are named by index and T? is optional', () => {
    // given
    const iface = getInterface(`
      export interface ITestEvent {
        name: 'x';
        args: [string, number?];
      }`);

    // test
    const args = getEventArgMetadata(iface);

    // expect
    expect(args).toEqual([
      {name: 'arg0', type: 'string'},
      {name: 'arg1', type: 'number', optional: true},
    ]);
  });

  test('given an empty args tuple, when read, then there are no args', () => {
    // given
    const iface = getInterface(`
      export interface ITestEvent {
        name: 'x';
        args: [];
      }`);

    // expect
    expect(getEventArgMetadata(iface)).toEqual([]);
  });
});

describe('formatEventArgMetadata', () => {
  test('given a type and a description with quotes and backslashes, when formatted, then the generated literal evaluates to the same strings', () => {
    // given
    const args = [
      {
        name: 'value',
        type: "'a' | 'b'",
        description: "It's a \\ path",
        optional: true,
      },
    ];

    // test
    const source = formatEventArgMetadata(args, true);
    const evaluated = new Function(`return [${source}];`)();

    // expect
    expect(evaluated).toEqual(args);
  });

  test('given an optional arg, when formatted without optional support, then the flag is left out', () => {
    // test
    const source = formatEventArgMetadata(
      [{name: 'a', type: 'number', optional: true}],
      false
    );

    // expect
    expect(new Function(`return [${source}];`)()).toEqual([
      {name: 'a', type: 'number'},
    ]);
  });
});

describe('generated event metadata', () => {
  test('given request-video-url declares @param docs, when its generated metadata is read, then every arg has a description', () => {
    // test
    const {args} = requestVideoUrl();

    // expect
    expect(args.map(arg => arg.name)).toEqual([
      'videoUrlIndex',
      'requestedVideoPosition',
      'fromRouting',
    ]);
    expect(args.every(arg => (arg.description ?? '').length > 0)).toBe(true);
  });
});
