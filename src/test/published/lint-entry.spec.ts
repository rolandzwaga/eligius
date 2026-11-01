// @vitest-environment node
import {describe, expect, test, vi} from 'vitest';

// Imports the BUILT package through its own `exports` map (npm run test:published).
// The lint entry is its own build and must load in plain Node.
vi.mock('jquery', () => {
  throw new Error('eligius/lint must not import jquery');
});
vi.mock('lottie-web', () => {
  throw new Error('eligius/lint must not import lottie-web');
});

describe('eligius/lint published entry', () => {
  test('given the built package in Node without a DOM, when a configuration is linted, then the resolver error and the rules report', async () => {
    const {lintConfiguration} = await import('eligius/lint');
    expect(typeof window).toBe('undefined');

    const diagnostics = lintConfiguration({
      id: 'published',
      engine: {systemName: 'EligiusEngine'},
      containerSelector: '#app',
      cssFiles: [],
      language: 'en-US',
      layoutTemplate: '<div></div>',
      availableLanguages: [],
      timelineProviderSettings: {
        animation: {positionSource: {systemName: 'RafPositionSource'}},
      },
      initActions: [],
      actions: [],
      timelines: [
        {
          id: 't',
          uri: 'main',
          type: 'animation',
          duration: 1,
          loop: false,
          selector: '#app',
          timelineActions: [
            {
              id: 'a',
              name: 'A',
              duration: {start: 0, end: 1},
              startOperations: [
                {
                  id: '1',
                  systemName: 'addClass',
                  operationData: {className: 'x'},
                },
                {
                  id: '2',
                  systemName: 'selectElemen',
                  operationData: {selector: '#x'},
                },
                {id: '3', systemName: 'endWhen'},
              ],
              endOperations: [],
            },
          ],
        },
      ],
    });

    expect(diagnostics.map(d => [d.code, d.path])).toEqual([
      ['E001', 'timelines[0].timelineActions[0].startOperations[1].systemName'],
      ['E101', 'timelines[0].timelineActions[0].startOperations[2].systemName'],
      ['W110', 'timelines[0].timelineActions[0].startOperations[0]'],
    ]);
    expect(diagnostics[0].message).toContain("Did you mean 'selectElement'");
  });
});
