import {readdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {EligiusResourceImporter} from '@importer/eligius-resource-importer.ts';
import {
  builtInControllerNames,
  builtInOperationNames,
  builtInProviderNames,
} from '@lint/built-in-names.ts';
import {RESOLVING_FIELDS} from '@lint/resolving-fields.ts';
import dashToCamelCase from '@util/dash-to-camel-case.ts';
import {describe, expect, test} from 'vitest';

const operationDir = join(__dirname, '..', '..', '..', 'operation');

/**
 * The helper calls through which an operation resolves property chains. An
 * operation that calls one of them resolves chains in some field and must be
 * listed in RESOLVING_FIELDS; one that calls none passes chains on as text
 * and must not be listed. (Imports alone do not count: `setVariable` and
 * `invokeObjectMethod` import scope and guard helpers from the same modules
 * without resolving anything.)
 */
const resolvingCalls = [
  'resolvePropertyValues(',
  'resolveExternalPropertyChain(',
  'resolveEventArguments(',
  'resolvePropertyChain(',
  'getPropertyChainValue(',
  'getParsedExpression(',
  'parseExpression(',
  'evaluateExpression(',
];

describe('lint conformance with the runtime', () => {
  test('given the operation sources, when the operations that call a resolving helper are listed, then they are exactly the operations in RESOLVING_FIELDS', () => {
    const resolving = readdirSync(operationDir)
      .filter(
        file =>
          file.endsWith('.ts') && file !== 'index.ts' && file !== 'types.ts'
      )
      .filter(file => {
        const source = readFileSync(join(operationDir, file), 'utf8').replace(
          /^import[\s\S]*?;$/gm,
          ''
        );
        return resolvingCalls.some(call => source.includes(call));
      })
      .map(file => dashToCamelCase(file.replace(/\.ts$/, '')))
      .sort();

    expect(resolving).toEqual(Object.keys(RESOLVING_FIELDS).sort());
  });

  test('given the runtime importer, when its name lists are compared with the lint lists, then they are equal', () => {
    const importer = new EligiusResourceImporter();
    expect([...builtInOperationNames].sort()).toEqual(
      importer.getOperationNames().sort()
    );
    expect([...builtInControllerNames].sort()).toEqual(
      importer.getControllerNames().sort()
    );
    expect(builtInProviderNames).toEqual(importer.getProviderNames());
  });
});
