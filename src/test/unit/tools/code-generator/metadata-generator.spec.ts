// @vitest-environment node
import * as operationMetadata from '@operation/metadata/index.ts';
import camelCaseToDash from '@util/camel-case-to-dash.ts';
import {
  type InterfaceDeclaration,
  Project,
  type PropertySignature,
  type SourceFile,
  SyntaxKind,
  type TypeAliasDeclaration,
} from 'ts-morph';
import {describe, expect, test} from 'vitest';
import {getDataProperties} from '@/tools/code-generator/shared.ts';

// These tests check the output of `npm run opers-metadata` against the
// operation sources it was generated from.

type TPropertyEntry = {type?: unknown; required?: boolean; erased?: boolean};

type TGeneratedMetadata = {
  description: string;
  category: string;
  dependentProperties?: string[];
  properties?: Record<string, TPropertyEntry>;
  outputProperties?: Record<string, TPropertyEntry>;
};

const project = new Project({
  skipAddingFilesFromTsConfig: true,
  compilerOptions: {noEmit: true},
});
const sourceFiles = project
  .addSourceFilesAtPaths('./src/operation/*.ts')
  .filter(
    file =>
      file.getBaseName() !== 'index.ts' && file.getBaseName() !== 'types.ts'
  );

const generated = Object.entries(operationMetadata).filter(
  ([, value]) => typeof value === 'function'
) as [string, () => TGeneratedMetadata][];

function tagNames(property: PropertySignature): string[] {
  return property
    .getJsDocs()
    .flatMap(doc => doc.getTags())
    .map(tag => tag.getTagName());
}

function typeTag(property: PropertySignature): string | undefined {
  const comment = property
    .getJsDocs()
    .flatMap(doc => doc.getTags())
    .find(tag => tag.getTagName() === 'type')
    ?.getComment();
  return typeof comment === 'string' ? comment.trim() : undefined;
}

function getSource(operationName: string) {
  const sourceFile = project.getSourceFileOrThrow(
    `./src/operation/${camelCaseToDash(operationName)}.ts`
  );
  const statement = sourceFile
    .getVariableStatements()
    .find(stat => stat.isExported());
  if (!statement) {
    throw new Error(`no exported operation in ${sourceFile.getBaseName()}`);
  }
  return {sourceFile, statement};
}

/**
 * The JSDoc text of the operation. Line endings are normalised: a template
 * literal turns the CRLF of a Windows checkout into LF.
 */
function getDescription(operationName: string): string {
  return getSource(operationName)
    .statement.getJsDocs()
    .map(doc => doc.getCommentText())
    .join('')
    .replaceAll('\r\n', '\n');
}

function getDataType(
  sourceFile: SourceFile,
  operationName: string
): InterfaceDeclaration | TypeAliasDeclaration | undefined {
  const declaration = sourceFile.getVariableDeclarationOrThrow(operationName);
  const typeRef = declaration.getDescendantsOfKind(SyntaxKind.TypeReference)[0];
  const typeName =
    typeRef
      ?.getTypeArguments()[0]
      ?.getText()
      .replace(/<[^>]+>/g, '')
      .split('.')
      .pop() ?? '';
  return sourceFile.getTypeAlias(typeName) ?? sourceFile.getInterface(typeName);
}

/**
 * Lists every difference between the generated entry and the doc tags of the
 * source property.
 */
function compareProperty(
  where: string,
  property: PropertySignature,
  entry: TPropertyEntry | undefined
): string[] {
  if (!entry) {
    return [`${where}: missing from the metadata`];
  }
  const tags = tagNames(property);
  const mismatches: string[] = [];
  if ((entry.required === true) !== tags.includes('required')) {
    mismatches.push(`${where}: required ${entry.required} vs tags [${tags}]`);
  }
  if ((entry.erased === true) !== tags.includes('erased')) {
    mismatches.push(`${where}: erased ${entry.erased} vs tags [${tags}]`);
  }
  const tagged = typeTag(property);
  if (tagged !== undefined && entry.type !== tagged) {
    mismatches.push(`${where}: type ${String(entry.type)} vs @type ${tagged}`);
  }
  return mismatches;
}

function sameList(actual: string[], expected: string[]): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

describe('operation metadata generator output', () => {
  test('given the operation source files, when the generated metadata is listed, then every operation has a metadata function', () => {
    // given
    const operationNames = sourceFiles.map(
      file =>
        file
          .getVariableStatements()
          .find(stat => stat.isExported())
          ?.getDeclarations()[0]
          ?.getName() ?? file.getBaseName()
    );

    // test
    const generatedNames = generated.map(([name]) => name);

    // expect
    expect([...generatedNames].sort()).toEqual([...operationNames].sort());
  });

  test('given every operation, when its generated description and category are compared with the source JSDoc, then the text survives escaping unchanged', () => {
    // given
    const mismatches: string[] = [];

    // test
    for (const [name, getMetadata] of generated) {
      const category = getSource(name)
        .statement.getJsDocs()
        .flatMap(doc => doc.getTags())
        .find(tag => tag.getTagName() === 'category')
        ?.getComment();
      const metadata = getMetadata();
      if (metadata.description !== getDescription(name)) {
        mismatches.push(`${name}: description differs`);
      }
      const expectedCategory =
        typeof category === 'string' ? category : 'unknown';
      if (metadata.category !== expectedCategory) {
        mismatches.push(
          `${name}: category ${metadata.category} vs ${expectedCategory}`
        );
      }
    }

    // expect
    expect(mismatches).toEqual([]);
  });

  test('given the when operation, whose description has backticks and $-prefixed chains, when its metadata is read, then both are kept', () => {
    // test
    const {description} = operationMetadata.when();

    // expect
    expect(description).toContain('`if`/`else`');
    expect(description).toContain('$scope.loopIndex');
    expect(description).toBe(getDescription('when'));
  });

  test('given every operation data type, when its properties are compared with their doc tags, then @dependency, @output, @required, @erased and @type are reflected in the metadata', () => {
    // given
    const mismatches: string[] = [];

    // test
    for (const [name, getMetadata] of generated) {
      const {sourceFile} = getSource(name);
      const dataType = getDataType(sourceFile, name);
      const metadata = getMetadata();
      const properties = dataType ? getDataProperties(dataType) : [];
      const dependencies = properties.filter(p =>
        tagNames(p).includes('dependency')
      );
      const outputs = properties.filter(p => tagNames(p).includes('output'));
      const inputs = properties.filter(
        p => !dependencies.includes(p) && !outputs.includes(p)
      );

      const dependentNames = dependencies.map(p => p.getName());
      if (!sameList(metadata.dependentProperties ?? [], dependentNames)) {
        mismatches.push(
          `${name}: dependentProperties [${metadata.dependentProperties ?? []}] vs @dependency [${dependentNames}]`
        );
      }
      const inputNames = inputs.map(p => p.getName());
      if (!sameList(Object.keys(metadata.properties ?? {}), inputNames)) {
        mismatches.push(`${name}: properties differ from [${inputNames}]`);
      }
      const outputNames = outputs.map(p => p.getName());
      if (
        !sameList(Object.keys(metadata.outputProperties ?? {}), outputNames)
      ) {
        mismatches.push(
          `${name}: outputProperties differ from [${outputNames}]`
        );
      }
      for (const property of inputs) {
        mismatches.push(
          ...compareProperty(
            `${name}.${property.getName()}`,
            property,
            metadata.properties?.[property.getName()]
          )
        );
      }
      for (const property of outputs) {
        mismatches.push(
          ...compareProperty(
            `${name}.${property.getName()} (output)`,
            property,
            metadata.outputProperties?.[property.getName()]
          )
        );
      }
    }

    // expect
    expect(mismatches).toEqual([]);
  });

  test('given addClass with a @dependency selectedElement and a @required @erased className with @type, when its metadata is read, then each tag shows up in the entry', () => {
    // test
    const metadata = operationMetadata.addClass();

    // expect
    expect(metadata.dependentProperties).toEqual(['selectedElement']);
    expect(metadata.properties).toEqual({
      className: {
        type: 'ParameterType:className',
        required: true,
        erased: true,
      },
    });
  });
});
