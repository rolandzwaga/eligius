// @vitest-environment node
import {Project} from 'ts-morph';
import {describe, expect, test} from 'vitest';
import {
  findDuplicateEventNames,
  findEventFilesMissingFromIndex,
  getRequestEventNames,
  writeRequestMap,
} from '@/tools/code-generator/event-registry.ts';

const project = new Project({useInMemoryFileSystem: true});
let fileIndex = 0;

function createFile(source: string) {
  return project.createSourceFile(`file${fileIndex++}.ts`, source);
}

describe('findEventFilesMissingFromIndex', () => {
  test('given an index that exports two of three event files, when checked, then the third file is reported', () => {
    // given
    const index = createFile(`
      export type {AEvent} from '@eventbus/events/a-event.ts';
      export type {BEvent} from '@eventbus/events/b-event.ts';
      export type {AllEvents} from '@eventbus/events/types.ts';
    `);

    // test
    const missing = findEventFilesMissingFromIndex(
      ['a-event.ts', 'b-event.ts', 'c-event.ts'],
      index,
      '@eventbus/events'
    );

    // expect
    expect(missing).toEqual(['c-event.ts']);
  });

  test('given an index that exports every event file, when checked, then nothing is reported', () => {
    const index = createFile(`
      export type {AEvent} from '@eventbus/events/a-event.ts';
    `);

    expect(
      findEventFilesMissingFromIndex(['a-event.ts'], index, '@eventbus/events')
    ).toEqual([]);
  });
});

describe('getRequestEventNames and writeRequestMap', () => {
  test('given a broadcast event and two request events, when the RequestMap is written, then it has an entry per request event typed from the event interface', () => {
    // given
    const events = createFile(`
      export interface PlayEvent { name: 'timeline-play'; args: []; }
      export interface RootEvent { name: 'request-engine-root'; args: []; returns: string; }
      export interface ActionEvent { name: 'request-action'; args: [actionName: string]; returns: number; }
    `).getInterfaces();
    const output = createFile('');

    // test
    const requestEvents = getRequestEventNames(events);
    writeRequestMap(output, requestEvents);

    // expect
    expect(requestEvents).toEqual([
      {eventName: 'request-engine-root', interfaceName: 'RootEvent'},
      {eventName: 'request-action', interfaceName: 'ActionEvent'},
    ]);
    const map = output.getInterfaceOrThrow('RequestMap');
    expect(map.isExported()).toBe(true);
    expect(
      map
        .getProperties()
        .map(property => [
          property.getName(),
          property.getTypeNode()?.getText().replace(/\s+/g, ' '),
        ])
    ).toEqual([
      [
        "'request-action'",
        "{args: ActionEvent['args']; returns: ActionEvent['returns']}",
      ],
      [
        "'request-engine-root'",
        "{args: RootEvent['args']; returns: RootEvent['returns']}",
      ],
    ]);
  });

  test('given an event whose name is not a string literal, when request events are read, then it is skipped', () => {
    const events = createFile(`
      export interface Broken { name: string; args: []; returns: number; }
    `).getInterfaces();

    expect(getRequestEventNames(events)).toEqual([]);
  });
});

describe('findDuplicateEventNames', () => {
  test('given two event interfaces that declare the same name and a third with its own, when checked, then the shared name is reported with both interfaces', () => {
    // given
    const events = createFile(`
      export interface SeekEvent { name: 'timeline-seek'; args: [position: number]; }
      export interface PlayEvent { name: 'timeline-play'; args: []; }
      export interface SeekAgainEvent { name: 'timeline-seek'; args: [label: string]; }
    `).getInterfaces();

    // test
    const duplicates = findDuplicateEventNames(events);

    // expect
    expect(duplicates).toEqual(["'timeline-seek' (SeekEvent, SeekAgainEvent)"]);
  });

  test('given event interfaces with unique names and one without a literal name, when checked, then nothing is reported', () => {
    // given
    const events = createFile(`
      export interface PlayEvent { name: 'timeline-play'; args: []; }
      export interface Loose { name: string; args: []; }
      export interface AlsoLoose { name: string; args: []; }
    `).getInterfaces();

    // test + expect
    expect(findDuplicateEventNames(events)).toEqual([]);
  });

  test('given the event interfaces in src/eventbus/events, when checked, then no event name is declared twice', () => {
    // given
    const eventsProject = new Project({
      skipAddingFilesFromTsConfig: true,
      compilerOptions: {noEmit: true},
    });
    const interfaces = eventsProject
      .addSourceFilesAtPaths('./src/eventbus/events/*.ts')
      .filter(file => !['index.ts', 'types.ts'].includes(file.getBaseName()))
      .flatMap(file => file.getInterfaces().filter(i => i.isExported()));

    // test + expect
    expect(interfaces.length).toBeGreaterThan(10);
    expect(findDuplicateEventNames(interfaces)).toEqual([]);
  });
});
