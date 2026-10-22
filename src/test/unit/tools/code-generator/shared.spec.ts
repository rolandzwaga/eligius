// @vitest-environment node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {Project} from 'ts-morph';
import {afterEach, describe, expect, test} from 'vitest';
import {
  escapeTemplateLiteral,
  getDataProperties,
  getPropertiesWithoutTags,
  getPropertiesWithTags,
  getTypeFromTag,
  removeGeneratedFiles,
  toOperationDataType,
  toPathAlias,
  toStringLiteral,
} from '@/tools/code-generator/shared.ts';

const project = new Project({useInMemoryFileSystem: true});
let fileIndex = 0;

function createSourceFile(source: string) {
  return project.createSourceFile(
    `/src/operation/test${fileIndex++}.ts`,
    source
  );
}

describe('toPathAlias', () => {
  test('given absolute Windows and POSIX paths, when converted, then they use the tsconfig aliases', () => {
    expect(toPathAlias('F:\\repo\\src\\operation\\types.ts')).toBe(
      '@operation/types.ts'
    );
    expect(toPathAlias('/repo/src/locale/locale-manager.ts')).toBe(
      '@locale/locale-manager.ts'
    );
    expect(toPathAlias('/repo/src/types.ts')).toBe('@/types.ts');
    expect(toPathAlias('/elsewhere/file.ts')).toBe('/elsewhere/file.ts');
  });
});

describe('escapeTemplateLiteral', () => {
  test('given a description with backticks, ${ and backslashes, when escaped and evaluated as a template literal, then the text is unchanged', () => {
    // given
    const text = 'Use `${name}` and a regex like /\\d+/ \\n';

    // test
    const evaluated = new Function(
      `return \`${escapeTemplateLiteral(text)}\`;`
    )();

    // expect
    expect(evaluated).toBe(text);
  });
});

describe('toStringLiteral', () => {
  test('given text with quotes, backslashes and newlines, when evaluated, then the text is unchanged', () => {
    // given
    const text = "It's a\\b\nc";

    // test
    const evaluated = new Function(`return ${toStringLiteral(text)};`)();

    // expect
    expect(evaluated).toBe(text);
  });
});

describe('property helpers', () => {
  const source = `
    export interface IData {
      /**
       * @dependency
       */
      selectedElement: unknown;
      /**
       * @type=ParameterType:className
       * @required
       */
      className: string;
      /**
       * @output
       */
      result: string;
    }
    export type TData = {
      /** @required */
      a: string;
      b?: number;
    };
    export interface IGeneric<T extends string> {
      value: T;
    }`;

  test('given an interface, when filtering by tags, then dependency, output and input properties are separated', () => {
    // given
    const properties = getDataProperties(
      createSourceFile(source).getInterfaceOrThrow('IData')
    );

    // test
    const dependencies = getPropertiesWithTags(properties)('dependency');
    const inputs = getPropertiesWithoutTags(properties)('dependency', 'output');

    // expect
    expect(dependencies.map(p => p.getName())).toEqual(['selectedElement']);
    expect(inputs.map(p => p.getName())).toEqual(['className']);
  });

  test('given a type alias of a type literal, when reading its properties, then they are returned', () => {
    // given
    const alias = createSourceFile(source).getTypeAliasOrThrow('TData');

    // expect
    expect(getDataProperties(alias).map(p => p.getName())).toEqual(['a', 'b']);
  });

  test('given a @type tag, when converted, then it is a type entry with an escaped literal', () => {
    // given
    const property = createSourceFile(source)
      .getInterfaceOrThrow('IData')
      .getPropertyOrThrow('className');
    const tag = property
      .getJsDocs()
      .flatMap(doc => doc.getTags())
      .find(t => t.getTagName() === 'type')!;

    // expect
    expect(getTypeFromTag(tag)).toMatch(/^type: '.*ParameterType:className'$/);
  });

  test('given a @type tag with an unknown parameter type, when converted, then it throws naming the property and the type', () => {
    // given
    const property = createSourceFile(`
      export interface IData {
        /**
         * @type=ParameterType:string|ParameterType:somethingNew
         */
        value: string;
      }`)
      .getInterfaceOrThrow('IData')
      .getPropertyOrThrow('value');
    const tag = property
      .getJsDocs()
      .flatMap(doc => doc.getTags())
      .find(t => t.getTagName() === 'type')!;

    // expect
    expect(() => getTypeFromTag(tag)).toThrow(/value.*somethingNew/);
  });

  test('given a generic interface, when converted to a data type, then the constraint is filled in', () => {
    // given
    const generic = createSourceFile(source).getInterfaceOrThrow('IGeneric');

    // test
    const [importName, typeName] = toOperationDataType(generic);

    // expect
    expect(importName).toBe('IGeneric');
    expect(typeName).toBe('IGeneric<string>');
  });
});

describe('removeGeneratedFiles', () => {
  let directory: string | undefined;

  afterEach(() => {
    if (directory) {
      fs.rmSync(directory, {recursive: true, force: true});
    }
  });

  test('given a metadata directory with a stale file, when cleaned, then only types.ts and non-ts files are kept', () => {
    // given
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eligius-metadata-'));
    for (const name of ['types.ts', 'stale-operation.ts', 'index.ts', 'x.md']) {
      fs.writeFileSync(path.join(directory, name), '');
    }

    // test
    removeGeneratedFiles(directory);

    // expect
    expect(fs.readdirSync(directory).sort()).toEqual(['types.ts', 'x.md']);
  });
});
