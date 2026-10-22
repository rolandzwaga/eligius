// @vitest-environment node
import * as controllerMetadata from '@controllers/metadata/index.ts';
import camelCaseToDash from '@util/camel-case-to-dash.ts';
import {
  type ClassDeclaration,
  Project,
  type PropertySignature,
  ts,
} from 'ts-morph';
import {describe, expect, test} from 'vitest';
import {getDataProperties} from '@/tools/code-generator/shared.ts';

// These tests check the output of `npm run ctrls-metadata` against the
// controller sources it was generated from.

type TPropertyEntry = {type?: unknown; required?: boolean};

type TGeneratedMetadata = {
  description: string;
  dependentProperties?: string[];
  properties?: Record<string, TPropertyEntry>;
};

const project = new Project({
  skipAddingFilesFromTsConfig: true,
  compilerOptions: {noEmit: true},
});
const controllerFiles = project
  .addSourceFilesAtPaths('./src/controllers/*.ts')
  .filter(
    file =>
      !['index.ts', 'types.ts', 'base-controller.ts'].includes(
        file.getBaseName()
      )
  );

const generated = Object.entries(controllerMetadata).filter(
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

function getControllerClass(controllerName: string): ClassDeclaration {
  return project
    .getSourceFileOrThrow(
      `./src/controllers/${camelCaseToDash(controllerName)}.ts`
    )
    .getClassOrThrow(controllerName);
}

/**
 * The data type named by `implements IController<T>` or
 * `extends BaseController<T>`.
 */
function getControllerDataProperties(
  classDecl: ClassDeclaration
): PropertySignature[] {
  const implemented = classDecl
    .getHeritageClauses()
    .find(clause => clause.getToken() === ts.SyntaxKind.ImplementsKeyword)
    ?.getTypeNodes()[0];
  const heritage = implemented ?? classDecl.getExtends();
  const typeName = heritage?.getTypeArguments()[0]?.getText() ?? '';
  const sourceFile = classDecl.getSourceFile();
  const dataType =
    sourceFile.getTypeAlias(typeName) ?? sourceFile.getInterface(typeName);
  return dataType ? getDataProperties(dataType) : [];
}

describe('controller metadata generator output', () => {
  test('given the controller source files, when the generated metadata is listed, then every exported controller class has a metadata function', () => {
    // given
    const classNames = controllerFiles.map(
      file =>
        file
          .getClasses()
          .find(c => c.isExported())
          ?.getName() ?? file.getBaseName()
    );

    // test
    const generatedNames = generated.map(([name]) => name);

    // expect
    expect([...generatedNames].sort()).toEqual([...classNames].sort());
  });

  test('given every controller, when its generated description is compared with the class JSDoc, then the text survives escaping unchanged', () => {
    // given
    const mismatches: string[] = [];

    // test
    for (const [name, getMetadata] of generated) {
      // A template literal turns the CRLF of a Windows checkout into LF
      const description = getControllerClass(name)
        .getJsDocs()
        .map(doc => doc.getCommentText())
        .join('')
        .replaceAll('\r\n', '\n');
      if (getMetadata().description !== description) {
        mismatches.push(name);
      }
    }

    // expect
    expect(mismatches).toEqual([]);
  });

  test('given the LabelController description with backticks around markup, when its metadata is read, then the backticks and tags are kept', () => {
    // test
    const {description} = controllerMetadata.LabelController();

    // expect
    expect(description).toContain('`<br>`');
    expect(description).toContain('`javascript:`');
  });

  test('given every controller data type, when its properties are compared with their doc tags, then @dependency, @required and @type are reflected in the metadata', () => {
    // given
    const mismatches: string[] = [];

    // test
    for (const [name, getMetadata] of generated) {
      const metadata = getMetadata();
      const properties = getControllerDataProperties(getControllerClass(name));
      const dependencies = properties
        .filter(p => tagNames(p).includes('dependency'))
        .map(p => p.getName());
      const inputs = properties.filter(
        p =>
          !tagNames(p).includes('dependency') && !tagNames(p).includes('output')
      );

      if (
        JSON.stringify(metadata.dependentProperties ?? []) !==
        JSON.stringify(dependencies)
      ) {
        mismatches.push(`${name}: dependentProperties vs [${dependencies}]`);
      }
      const inputNames = inputs.map(p => p.getName());
      if (
        JSON.stringify(Object.keys(metadata.properties ?? {})) !==
        JSON.stringify(inputNames)
      ) {
        mismatches.push(`${name}: properties differ from [${inputNames}]`);
      }
      for (const property of inputs) {
        const where = `${name}.${property.getName()}`;
        const entry = metadata.properties?.[property.getName()];
        if (!entry) {
          continue;
        }
        const tags = tagNames(property);
        if ((entry.required === true) !== tags.includes('required')) {
          mismatches.push(`${where}: required ${entry.required}`);
        }
        const tagged = typeTag(property);
        if (tagged !== undefined && entry.type !== tagged) {
          mismatches.push(`${where}: type ${String(entry.type)} vs ${tagged}`);
        }
      }
    }

    // expect
    expect(mismatches).toEqual([]);
  });

  test('given DOMEventListenerController with a @dependency selectedElement and a @required eventName, when its metadata is read, then only eventName is required', () => {
    // test
    const metadata = controllerMetadata.DOMEventListenerController();

    // expect
    expect(metadata.dependentProperties).toEqual(['selectedElement']);
    expect(metadata.properties?.eventName).toEqual({
      type: 'ParameterType:eventName',
      required: true,
    });
    expect(metadata.properties?.actions).not.toHaveProperty('required');
  });
});
