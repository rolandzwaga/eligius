import {dirname, relative} from 'node:path';
import {
  type ClassDeclaration,
  type ExportDeclarationStructure,
  type HeritageClause,
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
} from 'ts-morph';
import {uppercaseFirstChar} from 'util/uppercase-first-char.ts';
import camelCaseToDash from '../../util/camel-case-to-dash.ts';
import dashToCamelCase from '../../util/dash-to-camel-case.ts';

const project = new Project({
  compilerOptions: {
    noEmit: true, // Prevent emitting .js/.d.ts files for source files
  },
  skipAddingFilesFromTsConfig: true, // Don't load files from tsconfig
});
project.addSourceFilesAtPaths('./src/controllers/*.ts');

const getImplementedInterface = (
  classDecl: ClassDeclaration
): HeritageClause | undefined => {
  // First check direct implementation
  const heritageClause = classDecl
    .getHeritageClauses()
    .find(h => h.getToken() === ts.SyntaxKind.ImplementsKeyword);
  
  if (heritageClause) {
    return heritageClause;
  }
  
  // Check if the class extends another class
  const extendsClause = classDecl
    .getHeritageClauses()
    .find(h => h.getToken() === ts.SyntaxKind.ExtendsKeyword);
  
  if (extendsClause) {
    const baseType = extendsClause.getTypeNodes()[0];
    const baseClass = baseType.getType().getSymbol()?.getDeclarations()[0];
    
    if (baseClass?.getKind() === SyntaxKind.ClassDeclaration) {
      return extendsClause;
    }
  }
  
  return undefined;
};

const createControllerMetadata = (sourceFile: SourceFile) => {
  const classDeclaration = sourceFile
    .getClasses()
    .find(stat => stat.isExported());
  if (!classDeclaration) {
    console.error(
      `Can't find an exported class in ${sourceFile.getBaseName()}`
    );
    return;
  }
  const heritageClause = getImplementedInterface(classDeclaration);
  if (!heritageClause) {
    console.error(
      `Class ${classDeclaration.getName()} in ${sourceFile.getBaseName()} does not implement an interface.`
    );
    return;
  }

  const implementedType = heritageClause.getTypeNodes()[0]; // Get the first implemented interface
  const typeArguments = implementedType.getTypeArguments();
  if (typeArguments.length === 0) {
    console.error(
      `Class ${classDeclaration.getName()} in ${sourceFile.getBaseName()} implements ${implementedType.getText()}, but this interface has no generic arguments`
    );
    return;
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
    return;
  }

  createSourceFile(classDeclaration)(interfaceOrTypeAlias);
};

const toImport =
  (sourceFile: SourceFile) => (typeParam: TypeParameterDeclaration) => {
    const constraint = typeParam.getConstraint()!;

    const declarationSourceFile = constraint.getSourceFile();
    const fromPath = dirname(sourceFile.getFilePath());
    const toPath = declarationSourceFile.getFilePath();
    const importPath = relative(fromPath, toPath).replaceAll('\\', '/');
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
  (declaration: ClassDeclaration) =>
  (operationData: TypeAliasDeclaration | InterfaceDeclaration | undefined) => {
    const fileName = camelCaseToDash(declaration.getNameOrThrow());
    const outputSourceFile = project.createSourceFile(
      `./src/controllers/metadata/${fileName}.ts`,
      '',
      {overwrite: true}
    );

    const [importName, operationDataName, imports] = operationData
      ? toOperationDataType(outputSourceFile)(operationData)
      : [undefined, undefined, []];

    if (importName) {
      outputSourceFile
        .addImportDeclaration({moduleSpecifier: `../${fileName}.ts`})
        .addNamedImport({name: importName, isTypeOnly: true});
    }
    outputSourceFile
      .addImportDeclaration({moduleSpecifier: './types.ts'})
      .addNamedImport({name: 'IControllerMetadata', isTypeOnly: true});
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
  return `${property.getName()}: {
        ${typeTag ? getTypeFromTag(typeTag) : getTypeFromProperty(property)},${required ? '\nrequired: true,' : ''}
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
    `./src/controllers/metadata/index.ts`,
    '',
    {overwrite: true}
  );
  outputSourceFile.addExportDeclarations(
    fileNames.map(name => {
      const namedExport = (name.startsWith('dom-')) ? 'DOMEventListenerController' : uppercaseFirstChar(
        dashToCamelCase(name.slice(0, -3))
      );
      return {
        kind: StructureKind.ExportDeclaration,
        moduleSpecifier: `./${name}`,
        namedExports: [namedExport],
      } as ExportDeclarationStructure;
    })
  );
  outputSourceFile.addExportDeclaration({moduleSpecifier: './types.ts'});
};

const controllerFiles = project
  .getSourceFiles()
  .filter(
    src => src.getBaseName() !== 'index.ts' && src.getBaseName() !== 'types.ts' && src.getBaseName() !== 'base-controller.ts'
  );

toIndexFile(
  project,
  controllerFiles.map(f => f.getBaseName())
);

controllerFiles.forEach(createControllerMetadata);
project.saveSync();

console.log('Ready.');
