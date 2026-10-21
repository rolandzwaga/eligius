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
import {Node, Project, type VariableDeclaration} from 'ts-morph';

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
    operationExports.push({
      operationName: name,
      dataTypeName: getOperationDataTypeName(declaration),
    });
  }
  return operationExports;
}

function getOperationDataTypeName(
  declaration: VariableDeclaration
): string | undefined {
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
      node =>
        (Node.isInterfaceDeclaration(node) ||
          Node.isTypeAliasDeclaration(node)) &&
        node.getSourceFile() === declaration.getSourceFile()
    );
  return definition ? typeName.getText() : undefined;
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

  for (const {operationName, dataTypeName} of operationExports) {
    const fileName = `${camelCaseToDash(operationName)}.json`;

    if (!dataTypeName) {
      // Operations without a data type only need their systemName
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
      // Create a fallback schema for complex generic types
      const fallbackSchema = createFallbackOperationSchema(
        operationName,
        typeName
      );
      fs.writeFileSync(
        path.join(operationsDirectory, fileName),
        JSON.stringify(fallbackSchema, null, 2)
      );

      console.log(
        `  ✓ ${fileName} (fallback - ${(error as Error).message.split('\n')[0]})`
      );
      successCount++;
    }
  }

  console.log(`\n  Generated: ${successCount}`);

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
  const schema: any = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: `https://rolandzwaga.github.io/eligius/jsonschema/operations/${camelCaseToDash(operationName)}.json`,
    type: 'object',
    title: `${operationName} Operation`,
    description,
    required: ['systemName'],
    properties: {
      id: {
        type: 'string',
        description: 'Unique identifier for the operation (UUID format)',
        pattern:
          '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
      },
      systemName: {
        const: operationName,
        description: 'The operation system name',
      },
    },
    additionalProperties: false,
  };

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

    // Check for @required tag in description or schema
    const isRequired =
      propSchema.description?.includes('@required') ||
      propSchema.required === true ||
      dataSchema.required?.includes(propName);

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
    if (
      typeof schemaType === 'string' &&
      schemaType.startsWith('= ParameterType:')
    ) {
      // Map ParameterType to JSON Schema types
      const paramType = schemaType.replace('= ParameterType:', '');
      processedProp.type = mapParameterTypeToJsonSchema(paramType);
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

  // Set required fields for the root configuration
  if (processed.properties) {
    processed.required = [
      'id',
      'engine',
      'containerSelector',
      'cssFiles',
      'language',
      'layoutTemplate',
      'availableLanguages',
      'initActions',
      'actions',
      'timelines',
    ];
  }

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
  }

  return processed;
}

/**
 * Maps ParameterType annotations to JSON Schema types.
 * ParameterTypes are custom metadata for editor tooling.
 */
function mapParameterTypeToJsonSchema(paramType: string): string {
  const typeMap: Record<string, string> = {
    // String-like types
    htmlElementName: 'string',
    className: 'string',
    selector: 'string',
    string: 'string',
    eventTopic: 'string',
    eventName: 'string',
    systemName: 'string',
    actionName: 'string',
    controllerName: 'string',
    url: 'string',
    htmlContent: 'string',
    labelId: 'string',
    ImagePath: 'string',
    QuadrantPosition: 'string',
    expression: 'string',
    mathfunction: 'string',
    languagecode: 'string',
    // Primitive types
    number: 'number',
    boolean: 'boolean',
    // Complex types
    object: 'object',
    array: 'array',
    dimensions: 'object',
    dimensionsModifier: 'object',
    jQuery: 'object',
    cssProperties: 'object',
    function: 'string', // Functions are typically passed as strings in JSON config
    Date: 'string', // Dates are typically passed as ISO strings in JSON config
  };

  return typeMap[paramType] || 'string';
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

function createFallbackOperationSchema(
  operationName: string,
  typeName?: string
): any {
  // Create a minimal schema for operations without a data type, or with complex
  // generic types that ts-json-schema-generator cannot handle
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: `https://rolandzwaga.github.io/eligius/jsonschema/operations/${camelCaseToDash(operationName)}.json`,
    type: 'object',
    title: `${operationName} Operation`,
    description: typeName
      ? `Schema for the ${operationName} operation (generated from ${typeName})`
      : `Schema for the ${operationName} operation`,
    required: ['systemName'],
    properties: {
      id: {
        type: 'string',
        description: 'Unique identifier for the operation (UUID format)',
        pattern:
          '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
      },
      systemName: {
        const: operationName,
        description: 'The operation system name',
      },
      operationData: {
        type: 'object',
        description:
          'Operation-specific configuration data. See TypeScript definition for full type information.',
        additionalProperties: true,
      },
    },
    additionalProperties: false,
  };
}
