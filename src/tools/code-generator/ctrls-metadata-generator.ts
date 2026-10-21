import camelCaseToDash from '@util/camel-case-to-dash.ts';
import dashToCamelCase from '@util/dash-to-camel-case.ts';
import {uppercaseFirstChar} from '@util/uppercase-first-char.ts';
import {
  type ClassDeclaration,
  type ExportDeclarationStructure,
  type ExpressionWithTypeArguments,
  type InterfaceDeclaration,
  Project,
  type PropertySignature,
  type SourceFile,
  StructureKind,
  type TypeAliasDeclaration,
  ts,
} from 'ts-morph';
import {getTypeFromProperty} from './property-type.ts';
import {
  escapeTemplateLiteral,
  getDataProperties,
  getPropertiesWithoutTags,
  getPropertiesWithTags,
  getTag,
  getTypeFromTag,
  removeGeneratedFiles,
  toOperationDataType,
} from './shared.ts';

const outputDirectory = './src/controllers/metadata';

const project = new Project({
  tsConfigFilePath: './tsconfig.json',
  compilerOptions: {
    noEmit: true, // Prevent emitting .js/.d.ts files for source files
  },
  skipAddingFilesFromTsConfig: true, // Don't load files from tsconfig (we'll add them manually)
});
project.addSourceFilesAtPaths('./src/controllers/*.ts');

const getImplementedInterface = (
  classDecl: ClassDeclaration
): ExpressionWithTypeArguments | undefined => {
  // First check direct implementation (implements IController<T>)
  const implementsClause = classDecl
    .getHeritageClauses()
    .find(h => h.getToken() === ts.SyntaxKind.ImplementsKeyword);

  if (implementsClause) {
    return implementsClause.getTypeNodes()[0];
  }

  // Check if the class extends a generic base class (extends BaseController<T>)
  const extendsExpression = classDecl.getExtends();
  if (extendsExpression) {
    const typeArgs = extendsExpression.getTypeArguments();
    if (typeArgs.length > 0) {
      return extendsExpression;
    }
  }

  return undefined;
};

const createControllerMetadata = (sourceFile: SourceFile): boolean => {
  const classDeclaration = sourceFile
    .getClasses()
    .find(stat => stat.isExported());
  if (!classDeclaration) {
    console.error(
      `Can't find an exported class in ${sourceFile.getBaseName()}`
    );
    return false;
  }
  const implementedType = getImplementedInterface(classDeclaration);
  if (!implementedType) {
    console.error(
      `Class ${classDeclaration.getName()} in ${sourceFile.getBaseName()} does not implement an interface or extend a generic base class.`
    );
    return false;
  }

  const typeArguments = implementedType.getTypeArguments();
  if (typeArguments.length === 0) {
    console.error(
      `Class ${classDeclaration.getName()} in ${sourceFile.getBaseName()} extends/implements ${implementedType.getText()}, but has no generic arguments`
    );
    return false;
  }
  const typeName = typeArguments[0].getText();

  const interfaceOrTypeAlias =
    sourceFile.getTypeAlias(typeName) ?? sourceFile.getInterface(typeName);
  if (
    !interfaceOrTypeAlias &&
    typeName !== 'TOperationData' &&
    typeName !== 'Record'
  ) {
    console.error(
      `The given typeref ${typeName} of ${implementedType.getText()} in ${sourceFile.getBaseName()} is neither a type alias or an interface`
    );
    return false;
  }

  createSourceFile(classDeclaration)(interfaceOrTypeAlias);
  return true;
};

const createSourceFile =
  (declaration: ClassDeclaration) =>
  (operationData: TypeAliasDeclaration | InterfaceDeclaration | undefined) => {
    const fileName = camelCaseToDash(declaration.getNameOrThrow());
    const outputSourceFile = project.createSourceFile(
      `${outputDirectory}/${fileName}.ts`,
      '',
      {overwrite: true}
    );

    // Controllers without a dedicated data type take any operation data
    const [importName, operationDataName, imports] = operationData
      ? toOperationDataType(operationData)
      : [undefined, 'TOperationData', []];

    // Top-level `import type { … }` so the type import is fully elided. Inline
    // `import { type … }` under verbatimModuleSyntax leaves a side-effect
    // `import "./controller"`, pulling the controller implementation (and jquery)
    // into the metadata-only bundle (`eligius/metadata`).
    if (importName) {
      outputSourceFile.addImportDeclaration({
        moduleSpecifier: `@controllers/${fileName}.ts`,
        isTypeOnly: true,
        namedImports: [importName],
      });
    } else {
      outputSourceFile.addImportDeclaration({
        moduleSpecifier: '@operation/types.ts',
        isTypeOnly: true,
        namedImports: ['TOperationData'],
      });
    }
    outputSourceFile.addImportDeclaration({
      moduleSpecifier: '@controllers/metadata/types.ts',
      isTypeOnly: true,
      namedImports: ['IControllerMetadata'],
    });
    imports.forEach(imp => {
      outputSourceFile.addImportDeclaration({
        moduleSpecifier: imp.importPath,
        isTypeOnly: true,
        namedImports: imp.types,
      });
    });

    outputSourceFile.addFunction({
      name: declaration.getName(),
      isExported: true,
      returnType: `IControllerMetadata<${operationDataName}>`,
      statements: writer => {
        writer.writeLine('return {');
        writer.writeLine(`description: \`${getDescription(declaration)}\`,`);

        const dependencies = getDependentPropertyNames(operationData);
        if (dependencies.trim().length) {
          writer.writeLine(`dependentProperties: [${dependencies}],`);
        }

        const inputs = getInputProperties(operationData);
        if (inputs.trim().length) {
          writer.writeLine(`properties: {\n${inputs}\n},`);
        }

        const outputs = getOutputProperties(operationData);
        if (outputs.trim().length) {
          writer.writeLine(`outputProperties: {\n${outputs}\n}`);
        }
        writer.writeLine(`};`);
      },
    });

    outputSourceFile.organizeImports().formatText({
      indentSize: 2,
      insertSpaceAfterCommaDelimiter: true,
      convertTabsToSpaces: true,
      insertSpaceAfterTypeAssertion: true,
      ensureNewLineAtEndOfFile: true,
      indentStyle: ts.IndentStyle.Smart,
    });
  };

const getDescription = (declaration: ClassDeclaration) => {
  const description = declaration
    .getJsDocs()
    .map(x => x.getCommentText())
    .join('');
  return escapeTemplateLiteral(description);
};

const getDependentPropertyNames = (
  operationData: TypeAliasDeclaration | InterfaceDeclaration | undefined
) => {
  if (!operationData) {
    return '';
  }
  const dependentProps = getPropertiesWithTags(
    getDataProperties(operationData)
  )('dependency');
  return dependentProps.map(x => `'${x.getName()}'`).join(', ');
};

const getInputProperties = (
  operationData: TypeAliasDeclaration | InterfaceDeclaration | undefined
) => {
  if (!operationData) {
    return '';
  }
  const inputProps = getPropertiesWithoutTags(getDataProperties(operationData))(
    'dependency',
    'output'
  );

  return inputProps.map(toProp).join(',\n');
};

const getOutputProperties = (
  operationData: TypeAliasDeclaration | InterfaceDeclaration | undefined
) => {
  if (!operationData) {
    return '';
  }
  const outputProps = getPropertiesWithTags(getDataProperties(operationData))(
    'output'
  );

  return outputProps.map(toProp).join(',\n');
};

const toProp = (property: PropertySignature) => {
  const docs = property.getJsDocs();
  const typeTag = getTag(docs)('type');
  const required = getTag(docs)('required');
  return `${property.getName()}: {
        ${typeTag ? getTypeFromTag(typeTag) : getTypeFromProperty(property)},${required ? '\nrequired: true,' : ''}
    }`;
};

const toIndexFile = (project: Project, fileNames: string[]) => {
  const outputSourceFile = project.createSourceFile(
    `${outputDirectory}/index.ts`,
    '',
    {overwrite: true}
  );
  outputSourceFile.addExportDeclarations(
    fileNames.map(name => {
      const namedExport = name.startsWith('dom-')
        ? 'DOMEventListenerController'
        : uppercaseFirstChar(dashToCamelCase(name.slice(0, -3)));
      return {
        kind: StructureKind.ExportDeclaration,
        moduleSpecifier: `@controllers/metadata/${name}`,
        namedExports: [namedExport],
      } as ExportDeclarationStructure;
    })
  );
  outputSourceFile.addExportDeclaration({
    moduleSpecifier: '@controllers/metadata/types.ts',
  });
};

const controllerFiles = project
  .getSourceFiles()
  .filter(
    src =>
      src.getBaseName() !== 'index.ts' &&
      src.getBaseName() !== 'types.ts' &&
      src.getBaseName() !== 'base-controller.ts'
  );

// Remove the output of controllers that were renamed or removed
removeGeneratedFiles(outputDirectory);

const failedFiles: string[] = [];
const generatedFiles = controllerFiles.filter(sourceFile => {
  try {
    if (createControllerMetadata(sourceFile)) {
      return true;
    }
  } catch (e) {
    console.error(
      `Failed to generate metadata for ${sourceFile.getBaseName()}: ${(e as Error).message}`
    );
  }
  failedFiles.push(sourceFile.getBaseName());
  return false;
});

// Only export the metadata files that were actually written
toIndexFile(
  project,
  generatedFiles.map(f => f.getBaseName())
);
project.saveSync();

if (failedFiles.length) {
  console.error(
    `Metadata generation failed for ${failedFiles.length} controller file(s): ${failedFiles.join(', ')}`
  );
  process.exit(1);
}

console.log('Ready.');
