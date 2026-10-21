import camelCaseToDash from '@util/camel-case-to-dash.ts';
import dashToCamelCase from '@util/dash-to-camel-case.ts';
import {
  type ExportDeclarationStructure,
  type InterfaceDeclaration,
  Project,
  type PropertySignature,
  type SourceFile,
  StructureKind,
  SyntaxKind,
  type TypeAliasDeclaration,
  ts,
  type VariableDeclaration,
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

const outputDirectory = './src/operation/metadata';

const project = new Project({
  tsConfigFilePath: './tsconfig.json',
  compilerOptions: {
    noEmit: true, // Prevent emitting .js/.d.ts files for source files
  },
  skipAddingFilesFromTsConfig: true, // Don't load files from tsconfig (we'll add them manually)
});
project.addSourceFilesAtPaths('./src/operation/*.ts');

const createOperationMetadata = (sourceFile: SourceFile): boolean => {
  const statement = sourceFile
    .getVariableStatements()
    .find(
      stat => stat.isExported() && stat.isKind(SyntaxKind.VariableStatement)
    );
  if (!statement) {
    console.error(
      `Can't find an exported statement in ${sourceFile.getBaseName()}`
    );
    return false;
  }

  const declaration = statement.getDeclarations()[0];
  if (!declaration) {
    console.error(
      `Exported variable statement in ${sourceFile.getBaseName()} doesn't have any declarations`
    );
    return false;
  }

  const typeRef = declaration.getDescendantsOfKind(SyntaxKind.TypeReference)[0];
  if (!typeRef) {
    console.error(
      `declaration ${declaration.getName()} in ${sourceFile.getBaseName()} does not have any type refences`
    );
    return false;
  }

  const typeArgs = typeRef.getTypeArguments();
  if (!typeArgs.length) {
    console.error(
      `The type reference for ${declaration.getName()} in ${sourceFile.getBaseName()} doesn't have any generics`
    );
    return false;
  }

  // Use the type node's text (AST) rather than the resolved type (type checker)
  // This preserves the original written type name (e.g., "IAddControllerToElementOperationData")
  // instead of the resolved type which may be "any" for complex generic types
  const typeName =
    typeArgs[0]
      .getText()
      .replace(/<[^>]+>/g, '')
      .split('.')
      .pop() || '';
  if (!typeName) {
    console.error(
      `Can't figure out the type name of the typeref of ${declaration.getName()} in ${sourceFile.getBaseName()}`
    );
    return false;
  }

  const interfaceOrTypeAlias =
    sourceFile.getTypeAlias(typeName) ?? sourceFile.getInterface(typeName);
  if (
    !interfaceOrTypeAlias &&
    typeName !== 'TOperationData' &&
    typeName !== 'Record'
  ) {
    console.error(
      `The given typeref ${typeName} of ${declaration.getName()} in ${sourceFile.getBaseName()} is neither a type alias or an interface`
    );
    return false;
  }

  createSourceFile(declaration)(interfaceOrTypeAlias);
  return true;
};

const createSourceFile =
  (declaration: VariableDeclaration) =>
  (operationData: TypeAliasDeclaration | InterfaceDeclaration | undefined) => {
    const fileName = camelCaseToDash(declaration.getName());
    const outputSourceFile = project.createSourceFile(
      `${outputDirectory}/${fileName}.ts`,
      '',
      {overwrite: true}
    );

    // Operations without a dedicated data type take any operation data
    const [importName, operationDataName, imports] = operationData
      ? toOperationDataType(operationData)
      : [undefined, 'TOperationData', []];

    // Use declaration-level `import type { … }` (not inline `import { type … }`).
    // Under verbatimModuleSyntax, an inline type specifier still emits a
    // side-effect `import "./mod"`, which drags the operation implementation
    // (and thus jquery) into the metadata-only bundle (`eligius/metadata`). A
    // top-level type-only import is fully elided.
    if (importName) {
      outputSourceFile.addImportDeclaration({
        moduleSpecifier: `@operation/${fileName}.ts`,
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
      moduleSpecifier: '@operation/metadata/types.ts',
      isTypeOnly: true,
      namedImports: ['IOperationMetadata'],
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
      returnType: `IOperationMetadata<${operationDataName}>`,
      statements: writer => {
        writer.writeLine('return {');
        writer.writeLine(`description: \`${getDescription(declaration)}\`,`);
        writer.writeLine(
          `category: \`${escapeTemplateLiteral(getCategory(declaration))}\`,`
        );

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

const getCategory = (declaration: VariableDeclaration) => {
  const statement = declaration.getVariableStatement();

  const tag = getTag(statement?.getJsDocs() ?? [])('category')?.getComment();
  if (typeof tag === 'string') {
    return tag;
  }
  return 'unknown';
};

const getDescription = (declaration: VariableDeclaration) => {
  const statement = declaration.getVariableStatement();
  const description =
    statement
      ?.getJsDocs()
      .map(x => x.getCommentText())
      .join('') ?? '';
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
  const erased = getTag(docs)('erased');

  return `${property.getName()}: {
        ${typeTag ? getTypeFromTag(typeTag) : getTypeFromProperty(property)}${required ? ',\nrequired: true' : ''}${erased ? ',\nerased: true' : ''}
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
      const namedExport = dashToCamelCase(name.slice(0, -3));
      return {
        kind: StructureKind.ExportDeclaration,
        moduleSpecifier: `@operation/metadata/${name}`,
        namedExports: [namedExport],
      } as ExportDeclarationStructure;
    })
  );
  outputSourceFile.addExportDeclaration({
    moduleSpecifier: '@operation/metadata/types.ts',
  });
};

const operationFiles = project
  .getSourceFiles()
  .filter(
    src => src.getBaseName() !== 'index.ts' && src.getBaseName() !== 'types.ts'
  );

// Remove the output of operations that were renamed or removed
removeGeneratedFiles(outputDirectory);

const failedFiles: string[] = [];
const generatedFiles = operationFiles.filter(sourceFile => {
  try {
    if (createOperationMetadata(sourceFile)) {
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
    `Metadata generation failed for ${failedFiles.length} operation file(s): ${failedFiles.join(', ')}`
  );
  process.exit(1);
}

console.log('Ready.');
