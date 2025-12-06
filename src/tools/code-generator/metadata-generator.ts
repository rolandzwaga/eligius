import camelCaseToDash from '@util/camel-case-to-dash.ts';
import dashToCamelCase from '@util/dash-to-camel-case.ts';
import {
  type ExportDeclarationStructure,
  type InterfaceDeclaration,
  type JSDoc,
  type JSDocTag,
  Project,
  type PropertySignature,
  type SourceFile,
  StructureKind,
  SyntaxKind,
  type TypeAliasDeclaration,
  type TypeParameterDeclaration,
  ts,
  type VariableDeclaration,
} from 'ts-morph';

/**
 * Converts a file path to use path aliases based on the project's tsconfig paths.
 * @param filePath - The file path to convert (can be relative or absolute)
 * @returns The path with alias prefix if applicable
 */
const toPathAlias = (filePath: string): string => {
  // Normalize path separators
  const normalizedPath = filePath.replaceAll('\\', '/');

  // Map of directory patterns to their aliases
  const aliasMap: Record<string, string> = {
    'src/action/': '@action/',
    'src/configuration/': '@configuration/',
    'src/controllers/': '@controllers/',
    'src/eventbus/': '@eventbus/',
    'src/importer/': '@importer/',
    'src/operation/': '@operation/',
    'src/timelineproviders/': '@timelineproviders/',
    'src/util/': '@util/',
    'src/test/': '@test/',
    'src/': '@/',
  };

  for (const [pattern, alias] of Object.entries(aliasMap)) {
    const index = normalizedPath.indexOf(pattern);
    if (index !== -1) {
      return alias + normalizedPath.substring(index + pattern.length);
    }
  }

  return normalizedPath;
};

const project = new Project({
  tsConfigFilePath: './tsconfig.json',
  compilerOptions: {
    noEmit: true, // Prevent emitting .js/.d.ts files for source files
  },
  skipAddingFilesFromTsConfig: true, // Don't load files from tsconfig (we'll add them manually)
});
project.addSourceFilesAtPaths('./src/operation/*.ts');

const createOperationMetadata = (sourceFile: SourceFile) => {
  const statement = sourceFile
    .getVariableStatements()
    .find(
      stat => stat.isExported() && stat.isKind(SyntaxKind.VariableStatement)
    );
  if (!statement) {
    console.error(
      `Can't find an exported statement in ${sourceFile.getBaseName()}`
    );
    return;
  }

  const declaration = statement.getDeclarations()[0];
  if (!declaration) {
    console.error(
      `Exported variable statement in ${sourceFile.getBaseName()} doesn't have any declarations`
    );
    return;
  }

  const typeRef = declaration.getDescendantsOfKind(SyntaxKind.TypeReference)[0];
  if (!typeRef) {
    console.error(
      `declaration ${declaration.getName()} in ${sourceFile.getBaseName()} does not have any type refences`
    );
    return;
  }

  const typeArgs = typeRef.getTypeArguments();
  if (!typeArgs.length) {
    console.error(
      `The type reference for ${declaration.getName()} in ${sourceFile.getBaseName()} doesn't have any generics`
    );
    return;
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
    return;
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
    return;
  }

  createSourceFile(declaration)(interfaceOrTypeAlias);
};

const toImport =
  (_sourceFile: SourceFile) => (typeParam: TypeParameterDeclaration) => {
    const constraint = typeParam.getConstraint()!;
    let declarationSourceFile: SourceFile | null = null;

    // First approach: If constraint is a TypeReference, use getDefinitionNodes()
    // This follows through imports to find the actual definition location
    if (constraint.isKind(SyntaxKind.TypeReference)) {
      const typeName = constraint.getTypeName();
      // Only Identifier has getDefinitionNodes(), not QualifiedName
      if (typeName.isKind(SyntaxKind.Identifier)) {
        // getDefinitionNodes() resolves through imports to find the actual definition
        const definitionNodes = typeName.getDefinitionNodes();
        if (definitionNodes.length > 0) {
          declarationSourceFile = definitionNodes[0].getSourceFile();
        }
      }
    }

    // Second approach: Try via the type's alias symbol or symbol
    if (!declarationSourceFile) {
      const constraintType = constraint.getType();
      const symbol =
        constraintType.getAliasSymbol() ?? constraintType.getSymbol();
      const declarations = symbol?.getDeclarations();
      if (declarations && declarations.length > 0) {
        declarationSourceFile = declarations[0].getSourceFile();
      }
    }

    // Final fallback to the constraint's source file
    if (!declarationSourceFile) {
      declarationSourceFile = constraint.getSourceFile();
    }

    const toPath = declarationSourceFile.getFilePath();
    const importPath = toPathAlias(toPath);
    return {
      types: [constraint.getText()],
      importPath,
    };
  };

const toOperationDataType =
  (sourceFile: SourceFile) =>
  (operationData: TypeAliasDeclaration | InterfaceDeclaration) => {
    const name = operationData.getName();
    const args = operationData.getTypeParameters();
    if (args.length) {
      const nameWithGenerics = `${name}<${args.map(a => a.getConstraint()!.getText()).join(', ')}>`;
      const imports = args.reduce<ReturnType<ReturnType<typeof toImport>>[]>(
        (acc, item) => {
          const impor = toImport(sourceFile)(item);
          const found = acc.find(itm => itm.importPath === impor.importPath);
          if (found) {
            found.types.push(...impor.types);
            return acc;
          }
          return [...acc, impor];
        },
        [] as ReturnType<ReturnType<typeof toImport>>[]
      );
      return [name, nameWithGenerics, imports] as const;
    }
    return [name, name, []] as const;
  };

const createSourceFile =
  (declaration: VariableDeclaration) =>
  (operationData: TypeAliasDeclaration | InterfaceDeclaration | undefined) => {
    const fileName = camelCaseToDash(declaration.getName());
    const outputSourceFile = project.createSourceFile(
      `./src/operation/metadata/${fileName}.ts`,
      '',
      {overwrite: true}
    );

    const [importName, operationDataName, imports] = operationData
      ? toOperationDataType(outputSourceFile)(operationData)
      : [undefined, undefined, []];

    if (importName) {
      outputSourceFile
        .addImportDeclaration({moduleSpecifier: `@operation/${fileName}.ts`})
        .addNamedImport({name: importName, isTypeOnly: true});
    }
    outputSourceFile
      .addImportDeclaration({moduleSpecifier: '@operation/metadata/types.ts'})
      .addNamedImport({name: 'IOperationMetadata', isTypeOnly: true});
    imports.forEach(imp => {
      const importDeclaration = outputSourceFile.addImportDeclaration({
        moduleSpecifier: imp.importPath,
      });
      imp.types.forEach(type =>
        importDeclaration.addNamedImport({name: type, isTypeOnly: true})
      );
    });

    outputSourceFile.addFunction({
      name: declaration.getName(),
      isExported: true,
      returnType: `IOperationMetadata<${operationDataName}>`,
      statements: writer => {
        writer.writeLine('return {');
        writer.writeLine(`description: \`${getDescription(declaration)}\`,`);
        writer.writeLine(`category: \`${getCategory(declaration)}\`,`);

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
  const description = statement
    ?.getJsDocs()
    .map(x => x.getCommentText())
    .join('');
  return description?.replaceAll('`', '\\`');
};

const getDependentPropertyNames = (
  operationData: TypeAliasDeclaration | InterfaceDeclaration | undefined
) => {
  if (!operationData) {
    return '';
  }
  const properties = operationData.isKind(SyntaxKind.InterfaceDeclaration)
    ? operationData.getProperties()
    : operationData
        .getDescendantsOfKind(SyntaxKind.TypeLiteral)[0]
        ?.getProperties();
  if (properties) {
    const dependentProps = getPropertiesWithTags(properties)('dependency');
    return dependentProps.map(x => `'${x.getName()}'`).join(', ');
  } else {
    throw new Error(
      `Could not find properties on statement ${operationData.getName()} of kind: ${operationData.getKindName()}`
    );
  }
};

const getInputProperties = (
  operationData: TypeAliasDeclaration | InterfaceDeclaration | undefined
) => {
  if (!operationData) {
    return '';
  }
  const properties = operationData.isKind(SyntaxKind.InterfaceDeclaration)
    ? operationData.getProperties()
    : operationData
        .getDescendantsOfKind(SyntaxKind.TypeLiteral)[0]
        ?.getProperties();
  const inputProps = getPropertiesWithoutTags(properties)(
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
  const properties = operationData.isKind(SyntaxKind.InterfaceDeclaration)
    ? operationData.getProperties()
    : operationData
        .getDescendantsOfKind(SyntaxKind.TypeLiteral)[0]
        ?.getProperties();
  const outputProps = getPropertiesWithTags(properties)('output');

  return outputProps.map(toProp).join(',\n');
};

const toProp = (property: PropertySignature) => {
  const docs = property.getJsDocs();
  const typeTag = getTag(docs)('type');
  const required = getTag(docs)('required')!;
  const erased = getTag(docs)('erased')!;

  return `${property.getName()}: {
        ${typeTag ? getTypeFromTag(typeTag) : getTypeFromProperty(property)}${required ? ',\nrequired: true' : ''}${erased ? ',\nerased: true' : ''}
    }`;
};

const getTypeFromTag = (tag: JSDocTag) => {
  return `type: '${(tag.getComment()! as string).trim()}'`;
};

const getTypeFromProperty = (property: PropertySignature) => {
  const type = property.getType();
  if (type.isTypeParameter()) {
    const found = property
      .getParent()
      .getType()
      .getTypeArguments()
      .find(a => a.getText() === type.getSymbol()?.getName());
    if (!found) {
      throw new Error(
        `Can't resolve type parameter ${type.getSymbol()?.getName()} of property ${property.getName()}`
      );
    }
    const constraint = found.getConstraint();
    if (!constraint) {
      throw new Error(
        `No constriant on type parameter ${type.getSymbol()?.getName()} of property ${property.getName()}`
      );
    }
    if (constraint.isUnion()) {
      const unionValues = constraint
        .getUnionTypes()
        .map(u => u.getLiteralValue() ?? u.getText());
      return `type: [\n${unionValues
        .map(x => x.toString().replaceAll(/['`]/g, '\\$&'))
        .map(val => `{value: '${val}'}`)
        .join(',\n')}\n]`;
    }
    return `type: ParamType:${constraint.getText()}`;
  } else {
    const aliasSymbol = type.getAliasSymbol();
    const propType = aliasSymbol ? aliasSymbol.getName() : type.getText();
    if (type.isUnion() && propType !== 'boolean') {
      const unionValues = type
        .getUnionTypes()
        .map(u => u.getLiteralValue() ?? u.getText());
      return `type: [\n${unionValues
        .map(x => x.toString().replaceAll(/['`]/g, '\\$&'))
        .map(val => `{value: '${val}'}`)
        .join(',\n')}\n]`;
    } else {
      if (
        propType.startsWith('Record') ||
        propType === 'unknown' ||
        propType === 'any'
      ) {
        return `type: 'ParameterType:object'`;
      } else if (propType.endsWith('[]')) {
        const itemType = propType.slice(0, -2);
        if (itemType === 'unknown' || itemType === 'any') {
          return `type: 'ParameterType:array'`;
        } else {
          return `type: 'ParameterType:array',\nitemType: 'ParameterType:${itemType}'`;
        }
      } else if (propType.startsWith('(')) {
        return `type: 'ParameterType:function'`;
      }
      return `type: 'ParameterType:${propType}'`;
    }
  }
};

const getTag = (docs: JSDoc[]) => (tagName: string) => {
  return docs.flatMap(d => d.getTags()).find(t => t.getTagName() === tagName);
};

const getPropertiesWithTags =
  (properties: PropertySignature[]) =>
  (...tagNames: string[]) => {
    return properties.filter(
      prop =>
        prop
          .getJsDocs()
          .filter(doc =>
            doc.getTags().some(t => tagNames.includes(t.getTagName()))
          ).length > 0
    );
  };

const getPropertiesWithoutTags =
  (properties: PropertySignature[]) =>
  (...tagNames: string[]) => {
    return properties.filter(
      prop =>
        prop
          .getJsDocs()
          .filter(doc =>
            doc.getTags().some(t => tagNames.includes(t.getTagName()))
          ).length === 0
    );
  };

const toIndexFile = (project: Project, fileNames: string[]) => {
  const outputSourceFile = project.createSourceFile(
    `./src/operation/metadata/index.ts`,
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

toIndexFile(
  project,
  operationFiles.map(f => f.getBaseName())
);

operationFiles.forEach(createOperationMetadata);
project.saveSync();

console.log('Ready.');
