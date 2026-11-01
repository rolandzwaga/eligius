/**
 * Unified JSON Schema Generator
 *
 * Generates JSON schemas from TypeScript types:
 * 1. eligius-configuration.json - from IEngineConfiguration
 * 2. operations/*.json - from I*OperationData interfaces
 *
 * Usage: npm run generate-schema
 */
import fs from 'node:fs';
import path from 'node:path';
import camelCaseToDash from '@util/camel-case-to-dash.ts';
import {emptyDirSync} from 'fs-extra';
import {
  type Config,
  createGenerator,
  type SchemaGenerator,
} from 'ts-json-schema-generator';
import {
  type InterfaceDeclaration,
  type JSDocTag,
  Node,
  Project,
  type PropertySignature,
  type TypeAliasDeclaration,
  type VariableDeclaration,
} from 'ts-morph';
import {
  isParameterTypeTag,
  parameterTypeTagToJsonSchemaType,
} from './parameter-type-schema.ts';
import {forbidVideoOptions} from './video-options-rule.ts';

const schemaDirectory = path.join(process.cwd(), 'jsonschema');
const operationsDirectory = path.join(schemaDirectory, 'operations');

// Ensure directories exist
if (!fs.existsSync(schemaDirectory)) {
  fs.mkdirSync(schemaDirectory, {recursive: true});
}
emptyDirSync(operationsDirectory);

// =============================================================================
// Operation Schemas Generation (must be first - configuration references these)
// =============================================================================

console.log('═══════════════════════════════════════════════════════════════');
console.log('Generating Operation Schemas');
console.log('═══════════════════════════════════════════════════════════════');

generateOperationSchemas();

// =============================================================================
// Configuration Schema Generation (references operation schemas via oneOf)
// =============================================================================

console.log(
  '\n═══════════════════════════════════════════════════════════════'
);
console.log('Generating Configuration Schema');
console.log('═══════════════════════════════════════════════════════════════');

generateConfigurationSchema();

console.log('\n✓ All schemas generated successfully');

// =============================================================================
// Functions
// =============================================================================

function generateConfigurationSchema() {
  const configFile = path.join(schemaDirectory, 'eligius-configuration.json');

  const config: Config = {
    path: path.join(process.cwd(), 'src/configuration/types.ts'),
    tsconfig: path.join(process.cwd(), 'tsconfig.json'),
    type: 'IEngineConfiguration',
    expose: 'all',
    jsDoc: 'extended',
    topRef: false,
    skipTypeCheck: true,
    extraTags: ['example'],
    additionalProperties: false,
  };

  console.log(`  Source: ${config.path}`);
  console.log(`  Type: ${config.type}`);

  let generator: SchemaGenerator;
  try {
    generator = createGenerator(config);
  } catch (error) {
    console.error('Failed to create schema generator:', error);
    process.exit(1);
  }

  try {
    const schema = generator.createSchema(config.type);

    // Add JSON Schema metadata
    schema.$schema = 'http://json-schema.org/draft-07/schema#';
    schema.$id =
      'https://rolandzwaga.github.io/eligius/jsonschema/eligius-configuration.json';
    schema.title = 'Eligius Configuration Schema';

    // Post-process the schema
    const processedSchema = postProcessConfigSchema(schema);

    fs.writeFileSync(configFile, JSON.stringify(processedSchema, null, 2));
    console.log(
      `  ✓ eligius-configuration.json (${Object.keys(schema.definitions || {}).length} definitions)`
    );
  } catch (error) {
    console.error('Failed to generate configuration schema:', error);
    process.exit(1);
  }
}

interface IOperationExport {
  operationName: string;
  /**
   * Name of the operation data interface or type alias, undefined when the
   * operation has no dedicated data type (e.g. `TOperation<TOperationData>`).
   */
  dataTypeName?: string;
  /**
   * The declaration of the operation data type, used when ts-json-schema-generator
   * cannot handle it (generic or non-exported types).
   */
  dataTypeDeclaration?: InterfaceDeclaration | TypeAliasDeclaration;
}

/**
 * Enumerates every operation exported from src/operation/index.ts, together with
 * the data type name of its `TOperation<TData, ...>` declaration.
 */
function findOperationExports(indexPath: string): IOperationExport[] {
  const project = new Project({
    tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
    skipAddingFilesFromTsConfig: true,
  });
  const indexFile = project.addSourceFileAtPath(indexPath);
  project.resolveSourceFileDependencies();

  const operationExports: IOperationExport[] = [];
  for (const [name, declarations] of indexFile.getExportedDeclarations()) {
    const declaration = declarations[0];
    if (!Node.isVariableDeclaration(declaration)) {
      continue;
    }
    const dataType = getOperationDataType(declaration);
    operationExports.push({
      operationName: name,
      dataTypeName: dataType?.name,
      dataTypeDeclaration: dataType?.declaration,
    });
  }
  return operationExports;
}

function getOperationDataType(declaration: VariableDeclaration):
  | {
      name: string;
      declaration: InterfaceDeclaration | TypeAliasDeclaration;
    }
  | undefined {
  const typeNode = declaration.getTypeNode();
  if (!typeNode || !Node.isTypeReference(typeNode)) {
    return undefined;
  }
  const [dataTypeArgument] = typeNode.getTypeArguments();
  if (!dataTypeArgument || !Node.isTypeReference(dataTypeArgument)) {
    return undefined;
  }
  const typeName = dataTypeArgument.getTypeName();
  if (!Node.isIdentifier(typeName)) {
    return undefined;
  }
  // Only a data type declared next to the operation counts, shared types like
  // TOperationData describe no operation specific data.
  const definition = typeName
    .getDefinitionNodes()
    .find(
      (node): node is InterfaceDeclaration | TypeAliasDeclaration =>
        (Node.isInterfaceDeclaration(node) ||
          Node.isTypeAliasDeclaration(node)) &&
        node.getSourceFile() === declaration.getSourceFile()
    );
  return definition
    ? {name: typeName.getText(), declaration: definition}
    : undefined;
}

function generateOperationSchemas() {
  const indexPath = path.join(process.cwd(), 'src/operation/index.ts');
  const operationExports = findOperationExports(indexPath);

  console.log(`  Found ${operationExports.length} operations\n`);

  // Create a single generator for all operations
  const config: Config = {
    path: path.join(process.cwd(), 'src/operation/index.ts'),
    tsconfig: path.join(process.cwd(), 'tsconfig.json'),
    type: '*', // Will be overridden per type
    expose: 'all',
    jsDoc: 'extended',
    topRef: false,
    skipTypeCheck: true,
    extraTags: [
      'type',
      'required',
      'erased',
      'output',
      'dependency',
      'category',
      'example',
    ],
    additionalProperties: true, // Operations may have dynamic properties
  };

  let generator: SchemaGenerator;
  try {
    generator = createGenerator(config);
  } catch (error) {
    console.error('Failed to create operation schema generator:', error);
    process.exit(1);
  }

  let successCount = 0;
  const fallbacks: string[] = [];
  const failures: string[] = [];

  for (const {
    operationName,
    dataTypeName,
    dataTypeDeclaration,
  } of operationExports) {
    const fileName = `${camelCaseToDash(operationName)}.json`;

    if (!dataTypeName) {
      fs.writeFileSync(
        path.join(operationsDirectory, fileName),
        JSON.stringify(createFallbackOperationSchema(operationName), null, 2)
      );
      console.log(`  ✓ ${fileName} (no operation data type)`);
      successCount++;
      continue;
    }

    const typeName = dataTypeName;
    try {
      const schema = generator.createSchema(typeName);

      // Wrap in operation schema structure
      const operationSchema = createOperationSchema(
        operationName,
        typeName,
        schema
      );

      fs.writeFileSync(
        path.join(operationsDirectory, fileName),
        JSON.stringify(operationSchema, null, 2)
      );

      console.log(`  ✓ ${fileName}`);
      successCount++;
    } catch (error) {
      const reason = (error as Error).message.split('\n')[0];
      if (!dataTypeDeclaration) {
        // Without the declaration the @required properties would be lost
        console.error(`  ✗ ${fileName} (${reason}, no declaration found)`);
        failures.push(operationName);
        continue;
      }
      // ts-json-schema-generator cannot handle some types (generics, types that
      // are not exported), describe them from the declaration instead.
      const fallbackSchema = createOperationSchemaFromDeclaration(
        operationName,
        dataTypeDeclaration
      );
      fs.writeFileSync(
        path.join(operationsDirectory, fileName),
        JSON.stringify(fallbackSchema, null, 2)
      );

      console.warn(`  ⚠ ${fileName} (fallback - ${reason})`);
      fallbacks.push(operationName);
    }
  }

  console.log(`\n  Generated: ${successCount}`);
  if (fallbacks.length) {
    console.warn(
      `  Generated from the declaration (fallback): ${fallbacks.length} (${fallbacks.join(', ')})`
    );
  }
  if (failures.length) {
    console.error(`  Failed: ${failures.length} (${failures.join(', ')})`);
    process.exit(1);
  }

  // Every exported operation must have a schema, otherwise valid configurations
  // fail to validate against the IOperationConfiguration oneOf.
  const missing = operationExports.filter(
    ({operationName}) =>
      !fs.existsSync(
        path.join(operationsDirectory, `${camelCaseToDash(operationName)}.json`)
      )
  );
  if (missing.length) {
    console.error(
      `  Missing operation schemas for: ${missing.map(x => x.operationName).join(', ')}`
    );
    process.exit(1);
  }
}

function createOperationSchema(
  operationName: string,
  _typeName: string,
  dataSchema: any
): any {
  // Extract description from the schema if available
  const description =
    dataSchema.description || `Schema for the ${operationName} operation`;

  // Build the operation schema wrapper
  const schema = createOperationSchemaWrapper(operationName, description);

  // operationData is optional in IOperationConfiguration, so it is always allowed.
  // It only becomes required when at least one of its properties is required.
  const operationDataSchema: any = {
    type: 'object',
    description: 'Operation-specific configuration data',
    properties: {},
    additionalProperties: true,
  };

  // Extract required properties
  const requiredProps: string[] = [];

  for (const [propName, propSchema] of Object.entries(
    (dataSchema.properties ?? {}) as Record<string, any>
  )) {
    // @dependency properties are supplied at runtime by a previous operation,
    // not by the configuration
    const isDependency =
      propSchema.dependency !== undefined ||
      propSchema.description?.includes('@dependency');
    if (isDependency) {
      continue;
    }

    // Only the @required tag makes a property required, the same rule the
    // operation metadata uses. ts-json-schema-generator also lists every
    // non-optional TypeScript property in dataSchema.required, but operations
    // default many of those (e.g. setElementContent's insertionType).
    const isRequired =
      propSchema.description?.includes('@required') ||
      propSchema.required === true;

    // Check for @output tag - these are output properties, not input
    const isOutput =
      propSchema.description?.includes('@output') || propSchema.output === true;

    // Clean up description (remove JSDoc tags)
    let cleanDescription = propSchema.description || '';
    cleanDescription = cleanDescription
      .replace(/@type=\S+/g, '')
      .replace(/@required/g, '')
      .replace(/@erased/g, '')
      .replace(/@output/g, '')
      .replace(/@dependency/g, '')
      .trim();

    const processedProp: any = {};

    // Map the type properly - handle custom ParameterType annotations
    const schemaType = propSchema.type;
    if (isParameterTypeTag(schemaType)) {
      // The TypeScript type is the source of truth: when it produced a
      // composition or a reference, the @type editor hint adds no type.
      const hasTypeFromTypeScript =
        propSchema.anyOf ||
        propSchema.oneOf ||
        propSchema.allOf ||
        propSchema.$ref ||
        propSchema.enum ||
        propSchema.const !== undefined;
      const mappedType = hasTypeFromTypeScript
        ? undefined
        : parameterTypeTagToJsonSchemaType(schemaType);
      if (mappedType) {
        processedProp.type = mappedType;
      }
    } else if (schemaType) {
      processedProp.type = schemaType;
    }

    // Copy other valid JSON Schema properties
    if (propSchema.$ref) processedProp.$ref = propSchema.$ref;
    if (propSchema.items) processedProp.items = propSchema.items;
    if (propSchema.enum) processedProp.enum = propSchema.enum;
    if (propSchema.const) processedProp.const = propSchema.const;
    if (propSchema.anyOf) processedProp.anyOf = propSchema.anyOf;
    if (propSchema.oneOf) processedProp.oneOf = propSchema.oneOf;
    if (propSchema.allOf) processedProp.allOf = propSchema.allOf;
    if (propSchema.properties) processedProp.properties = propSchema.properties;
    if (propSchema.additionalProperties !== undefined)
      processedProp.additionalProperties = propSchema.additionalProperties;
    if (propSchema.default !== undefined)
      processedProp.default = propSchema.default;
    if (propSchema.pattern) processedProp.pattern = propSchema.pattern;
    if (propSchema.minimum !== undefined)
      processedProp.minimum = propSchema.minimum;
    if (propSchema.maximum !== undefined)
      processedProp.maximum = propSchema.maximum;

    if (cleanDescription) {
      processedProp.description = cleanDescription;
    }

    // Don't add output-only properties to required
    if (isRequired && !isOutput) {
      requiredProps.push(propName);
    }

    operationDataSchema.properties[propName] = processedProp;
  }

  if (requiredProps.length > 0) {
    operationDataSchema.required = requiredProps;
    schema.required.push('operationData');
  }

  schema.properties.operationData = operationDataSchema;

  // Add definitions if any, but filter out external types like jQuery
  if (
    dataSchema.definitions &&
    Object.keys(dataSchema.definitions).length > 0
  ) {
    const filteredDefinitions = filterExternalDefinitions(
      dataSchema.definitions
    );
    if (Object.keys(filteredDefinitions).length > 0) {
      schema.definitions = filteredDefinitions;
    }
  }

  // Replace $ref to JQuery with object type
  replaceJQueryRefs(schema);
  pruneDefinitions(schema);

  return schema;
}

function postProcessConfigSchema(schema: any): any {
  const processed = JSON.parse(JSON.stringify(schema));

  // The root `required` list comes from IEngineConfiguration, so it follows
  // the interface when that changes.

  // Get list of all operation schema files
  const operationSchemaFiles = fs
    .readdirSync(operationsDirectory)
    .filter(f => f.endsWith('.json'))
    .sort();

  // Build oneOf array with references to all operation schemas
  const operationOneOf = operationSchemaFiles.map(file => ({
    $ref: `operations/${file}`,
  }));

  // Replace IOperationConfiguration with oneOf referencing all operations
  if (processed.definitions) {
    // Find and update the IOperationConfiguration definition
    for (const name of Object.keys(processed.definitions)) {
      if (name.includes('IOperationConfiguration')) {
        // Replace the generic definition with oneOf
        processed.definitions[name] = {
          description:
            'An operation configuration. The systemName determines which operation type is used.',
          oneOf: operationOneOf,
        };
      }
    }

    // VideoPositionSource no longer accepts 'options' (4.0.0)
    forbidVideoOptions(processed.definitions);
  }

  return processed;
}

/**
 * Filter out external type definitions (like jQuery, HTMLElement, etc.)
 * that bloat the schema with millions of characters.
 *
 * For operation schemas, we only want to include types defined in the operation files,
 * not browser/DOM types from lib.dom.d.ts.
 */
function filterExternalDefinitions(
  definitions: Record<string, any>
): Record<string, any> {
  // External types like JQuery, HTMLElement etc. are dropped here, their $refs
  // are replaced with {type: "object"} by replaceJQueryRefs. Local definitions
  // (e.g. StorageType, Record<string, string>) are kept, because the operation
  // data properties $ref them.
  return Object.fromEntries(
    Object.entries(definitions).filter(
      ([name]) => !isExternalType(decodeURIComponent(name))
    )
  );
}

/**
 * Removes the definitions that the schema does not reference, and replaces any
 * $ref that points at a missing definition with an unconstrained schema, so that
 * every $ref in the schema resolves.
 */
function pruneDefinitions(schema: any): void {
  const definitions: Record<string, any> = schema.definitions ?? {};
  const reachable = new Set<string>();

  const visit = (node: any): void => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (
      typeof node.$ref === 'string' &&
      node.$ref.startsWith('#/definitions/')
    ) {
      // Definition keys are plain type names, $refs are URI encoded
      const name = decodeURIComponent(
        node.$ref.substring('#/definitions/'.length)
      );
      if (!Object.hasOwn(definitions, name)) {
        delete node.$ref;
      } else if (!reachable.has(name)) {
        reachable.add(name);
        visit(definitions[name]);
      }
    }
    for (const [key, value] of Object.entries(node)) {
      if (node === schema && key === 'definitions') continue;
      visit(value);
    }
  };
  visit(schema);

  for (const name of Object.keys(definitions)) {
    if (!reachable.has(name)) {
      delete definitions[name];
    }
  }
  if (schema.definitions && Object.keys(schema.definitions).length === 0) {
    delete schema.definitions;
  }
}

/**
 * Replace $ref to JQuery and other external types with simple object type.
 */
function replaceJQueryRefs(obj: any): void {
  if (!obj || typeof obj !== 'object') return;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      replaceJQueryRefs(item);
    }
    return;
  }

  // Replace $ref to external types
  if (obj.$ref && typeof obj.$ref === 'string') {
    const refName = obj.$ref.replace('#/definitions/', '');
    if (isExternalType(refName)) {
      delete obj.$ref;
      obj.type = 'object';
      obj.description = obj.description || `DOM element (${refName})`;
    }
  }

  // Recurse into nested objects
  for (const value of Object.values(obj)) {
    if (value && typeof value === 'object') {
      replaceJQueryRefs(value);
    }
  }
}

function isExternalType(typeName: string): boolean {
  const externalPatterns = [
    'JQuery',
    'HTMLElement',
    'Element',
    'Node',
    'Document',
    'Window',
    'Event',
    'DOM',
    'CSS',
  ];
  return externalPatterns.some(
    pattern => typeName.startsWith(pattern) || typeName.includes(pattern)
  );
}

/**
 * The schema of an operation configuration without its operationData.
 * `id` is required like in `IOperationConfiguration`, any string is accepted
 * (the resolver does not require UUIDs).
 */
function createOperationSchemaWrapper(
  operationName: string,
  description: string
): any {
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: `https://rolandzwaga.github.io/eligius/jsonschema/operations/${camelCaseToDash(operationName)}.json`,
    type: 'object',
    title: `${operationName} Operation`,
    description,
    required: ['id', 'systemName'],
    properties: {
      id: {
        type: 'string',
        description: 'Unique identifier for the operation',
      },
      systemName: {
        const: operationName,
        description: 'The operation system name',
      },
    },
    additionalProperties: false,
  };
}

function createFallbackOperationSchema(operationName: string): any {
  // Operations without a data type only need their systemName
  const schema = createOperationSchemaWrapper(
    operationName,
    `Schema for the ${operationName} operation`
  );
  schema.properties.operationData = {
    type: 'object',
    description: 'Operation-specific configuration data',
    additionalProperties: true,
  };
  return schema;
}

/**
 * Builds an operation schema from the operation data declaration, for the types
 * ts-json-schema-generator cannot handle. Properties get their description and
 * their `@type` tag type, and `@required` properties stay required, so the
 * schema is as strict as the operation metadata.
 */
function createOperationSchemaFromDeclaration(
  operationName: string,
  declaration: InterfaceDeclaration | TypeAliasDeclaration
): any {
  const schema = createOperationSchemaWrapper(
    operationName,
    `Schema for the ${operationName} operation (generated from ${declaration.getName()})`
  );
  const operationDataSchema: any = {
    type: 'object',
    description: 'Operation-specific configuration data',
    properties: {},
    additionalProperties: true,
  };
  const requiredProps: string[] = [];

  for (const property of getDeclarationProperties(declaration)) {
    const tags = property.getJsDocs().flatMap(doc => doc.getTags());
    const hasTag = (name: string) => tags.some(t => t.getTagName() === name);
    if (hasTag('dependency')) {
      continue;
    }

    const processedProp: any = {};
    const typeTag = tags.find(t => t.getTagName() === 'type');
    const mappedType = typeTag
      ? parameterTypeTagToJsonSchemaType(getTagText(typeTag))
      : undefined;
    if (mappedType) {
      processedProp.type = mappedType;
    }
    const description = property
      .getJsDocs()
      .map(doc => doc.getDescription().trim())
      .filter(Boolean)
      .join('\n');
    if (description) {
      processedProp.description = description;
    }

    if (hasTag('required') && !hasTag('output')) {
      requiredProps.push(property.getName());
    }
    operationDataSchema.properties[property.getName()] = processedProp;
  }

  if (requiredProps.length > 0) {
    operationDataSchema.required = requiredProps;
    schema.required.push('operationData');
  }
  schema.properties.operationData = operationDataSchema;
  return schema;
}

function getDeclarationProperties(
  declaration: InterfaceDeclaration | TypeAliasDeclaration
): PropertySignature[] {
  if (Node.isInterfaceDeclaration(declaration)) {
    return declaration.getProperties();
  }
  const typeNode = declaration.getTypeNode();
  return Node.isTypeLiteral(typeNode) ? typeNode.getProperties() : [];
}

function getTagText(tag: JSDocTag): string {
  const comment = tag.getComment();
  if (typeof comment === 'string') {
    return comment;
  }
  // The comment of `@type=ParameterType:x` may not be a plain string, fall
  // back to the tag text without the tag name
  return tag.getText().replace(/^@type/, '');
}
