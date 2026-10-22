import fs from 'node:fs';
import path from 'node:path';
import {
  type InterfaceDeclaration,
  type JSDoc,
  type JSDocTag,
  type PropertySignature,
  type SourceFile,
  SyntaxKind,
  type TypeAliasDeclaration,
  type TypeParameterDeclaration,
} from 'ts-morph';

/**
 * Helpers shared by the operation, controller and event metadata generators.
 */

/**
 * Converts a file path to use path aliases based on the project's tsconfig paths.
 * @param filePath - The file path to convert (can be relative or absolute)
 * @returns The path with alias prefix if applicable
 */
export const toPathAlias = (filePath: string): string => {
  // Normalize path separators
  const normalizedPath = filePath.replaceAll('\\', '/');

  // Map of directory patterns to their aliases
  const aliasMap: Record<string, string> = {
    'src/action/': '@action/',
    'src/adapters/': '@adapters/',
    'src/configuration/': '@configuration/',
    'src/controllers/': '@controllers/',
    'src/eventbus/': '@eventbus/',
    'src/importer/': '@importer/',
    'src/locale/': '@locale/',
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

export interface ITypeImport {
  types: string[];
  importPath: string;
}

/**
 * Returns the import that the constraint of the given type parameter needs.
 *
 * The declaration is found by following the constraint's type name through
 * imports, then through the type's alias symbol or symbol, and finally falls
 * back to the constraint's own source file.
 */
export const toImport = (typeParam: TypeParameterDeclaration): ITypeImport => {
  const constraint = typeParam.getConstraint();
  if (!constraint) {
    throw new Error(
      `Type parameter ${typeParam.getName()} has no constraint, the metadata needs one to name a concrete type`
    );
  }
  let declarationSourceFile: SourceFile | null = null;

  // First approach: If constraint is a TypeReference, use getDefinitionNodes()
  // This follows through imports to find the actual definition location
  if (constraint.isKind(SyntaxKind.TypeReference)) {
    const typeName = constraint.getTypeName();
    // Only Identifier has getDefinitionNodes(), not QualifiedName
    if (typeName.isKind(SyntaxKind.Identifier)) {
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

  return {
    types: [constraint.getText()],
    importPath: toPathAlias(declarationSourceFile.getFilePath()),
  };
};

/**
 * Returns the import name of the given data type, the name to use in the
 * metadata return type (with the constraints of its type parameters filled
 * in), and the imports those constraints need.
 */
export const toOperationDataType = (
  operationData: TypeAliasDeclaration | InterfaceDeclaration
): readonly [string, string, ITypeImport[]] => {
  const name = operationData.getName();
  const args = operationData.getTypeParameters();
  if (!args.length) {
    return [name, name, []] as const;
  }
  const imports = args.reduce<ITypeImport[]>((acc, item) => {
    const typeImport = toImport(item);
    const found = acc.find(itm => itm.importPath === typeImport.importPath);
    if (found) {
      found.types.push(...typeImport.types);
      return acc;
    }
    return [...acc, typeImport];
  }, []);
  const nameWithGenerics = `${name}<${args.map(a => a.getConstraint()!.getText()).join(', ')}>`;
  return [name, nameWithGenerics, imports] as const;
};

/**
 * Returns the first tag with the given name.
 */
export const getTag =
  (docs: JSDoc[]) =>
  (tagName: string): JSDocTag | undefined =>
    docs.flatMap(d => d.getTags()).find(t => t.getTagName() === tagName);

const hasAnyTag = (prop: PropertySignature, tagNames: string[]) =>
  prop
    .getJsDocs()
    .some(doc => doc.getTags().some(t => tagNames.includes(t.getTagName())));

/**
 * Returns the properties that carry at least one of the given tags.
 */
export const getPropertiesWithTags =
  (properties: PropertySignature[]) =>
  (...tagNames: string[]): PropertySignature[] =>
    properties.filter(prop => hasAnyTag(prop, tagNames));

/**
 * Returns the properties that carry none of the given tags.
 */
export const getPropertiesWithoutTags =
  (properties: PropertySignature[]) =>
  (...tagNames: string[]): PropertySignature[] =>
    properties.filter(prop => !hasAnyTag(prop, tagNames));

/**
 * Returns the properties of an interface, or of the first type literal of a
 * type alias.
 *
 * @throws When the type alias has no type literal
 */
export const getDataProperties = (
  operationData: TypeAliasDeclaration | InterfaceDeclaration
): PropertySignature[] => {
  if (operationData.isKind(SyntaxKind.InterfaceDeclaration)) {
    return operationData.getProperties();
  }
  const properties = operationData
    .getDescendantsOfKind(SyntaxKind.TypeLiteral)[0]
    ?.getProperties();
  if (!properties) {
    throw new Error(
      `Could not find properties on statement ${operationData.getName()} of kind: ${operationData.getKindName()}`
    );
  }
  return properties;
};

/**
 * Escapes text for use inside a template literal in generated code, so a
 * description that mentions a backtick, `${` or a backslash keeps its text.
 */
export const escapeTemplateLiteral = (text: string): string =>
  text.replaceAll('\\', '\\\\').replaceAll('`', '\\`').replaceAll('${', '\\${');

/**
 * Returns a single quoted string literal for generated code.
 */
export const toStringLiteral = (text: string): string =>
  `'${text
    .replaceAll('\\', '\\\\')
    .replaceAll("'", "\\'")
    .replaceAll('\r', '\\r')
    .replaceAll('\n', '\\n')}'`;

/**
 * Returns the `type: '...'` metadata entry for a `@type` tag.
 */
export const getTypeFromTag = (tag: JSDocTag): string => {
  const comment = tag.getComment();
  const text = typeof comment === 'string' ? comment : '';
  return `type: ${toStringLiteral(text.trim())}`;
};

/**
 * Deletes the generated `.ts` files from the given directory, except the hand
 * maintained ones. Run before a generator writes its output, so metadata of
 * renamed or removed sources does not linger (the files are gitignored, but
 * still type-checked).
 *
 * @param directory - The output directory
 * @param keep - File names to keep
 */
export const removeGeneratedFiles = (
  directory: string,
  keep: string[] = ['types.ts']
): void => {
  if (!fs.existsSync(directory)) {
    return;
  }
  for (const fileName of fs.readdirSync(directory)) {
    if (fileName.endsWith('.ts') && !keep.includes(fileName)) {
      fs.rmSync(path.join(directory, fileName));
    }
  }
};
