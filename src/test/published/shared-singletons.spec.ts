import * as main from 'eligius';
import * as configurationApi from 'eligius/configuration-api';
import * as runtime from 'eligius/runtime';
import {describe, expect, test} from 'vitest';

/**
 * Runs against the BUILT package (`npm run test:published`, which builds first):
 * `eligius` and `eligius/runtime` must come out of one tsdown build so that
 * an application importing both shares every module, in particular the
 * global data store, the JSON cache and the engine bookkeeping. Identity of
 * the exported classes and functions proves the modules are shared.
 */

const mainOnly = new Set([
  'EligiusResourceImporter',
  ...Object.keys(configurationApi),
]);

describe('eligius and eligius/runtime', () => {
  test('given both entries, when their exports are compared, then every runtime export is the very same object as the main one', () => {
    const names = Object.keys(runtime);
    expect(names.length).toBeGreaterThan(100);
    for (const name of names) {
      expect(runtime[name as keyof typeof runtime], name).toBe(
        main[name as keyof typeof main]
      );
    }
  });

  test('given the main entry, when its exports are listed, then runtime has all of them except the fluent API and EligiusResourceImporter', () => {
    const missing = Object.keys(main).filter(
      name => !mainOnly.has(name) && !(name in runtime)
    );
    expect(missing).toEqual([]);
    expect('ConfigurationFactory' in runtime).toBe(false);
    expect('EligiusResourceImporter' in runtime).toBe(false);
    expect('ActionEditor' in runtime).toBe(false);
  });

  test('given a global set through one entry, when read through the other, then it is the same store', () => {
    const importer = runtime.createImporter({
      operations: {setGlobalData: runtime.setGlobalData},
    });
    expect(main.createImporter).toBe(runtime.createImporter);
    expect(importer.import('setGlobalData')).toEqual({
      setGlobalData: main.setGlobalData,
    });
    expect(runtime.clearGlobals).toBe(main.clearGlobals);
    expect(runtime.EngineFactory).toBe(main.EngineFactory);
    expect(runtime.EligiusEngine).toBe(main.EligiusEngine);
  });
});
