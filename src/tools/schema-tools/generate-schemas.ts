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
import {emptyDirSync} from 'fs-extra';
import {
  type Config,
  createGenerator,
  type SchemaGenerator,
} from 'ts-json-schema-generator';

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

function generateOperationSchemas() {
  // Read the operation index to find all operation data types
  const indexPath = path.join(process.cwd(), 'src/operation/index.ts');
  const indexContent = fs.readFileSync(indexPath, 'utf-8');

  // Extract operation data type names (e.g., ISelectElementOperationData)
  const typeRegex = /export type \{(I\w+OperationData)\}/g;
  const operationTypes: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = typeRegex.exec(indexContent)) !== null) {
    operationTypes.push(match[1]);
  }

  console.log(`  Found ${operationTypes.length} operation types\n`);

  // Create a single generator for all operations
  const config: Config = {
    path: path.join(process.cwd(), 'src/operation/index.ts'),
    tsconfig: path.join(process.cwd(), 'tsconfig.json'),
    type: '*', // Will be overridden per type
    expose: 'all',
    jsDoc: 'extended',
    topRef: false,
    skipTypeCheck: true,
    extraTags: ['type', 'required', 'erased', 'output', 'category', 'example'],
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

  for (const typeName of operationTypes) {
    const operationName = typeNameToOperationName(typeName);
    const fileName = `${camelCaseToDash(operationName)}.json`;

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

  // Add operationData if the schema has properties
  if (dataSchema.properties && Object.keys(dataSchema.properties).length > 0) {
    schema.required.push('operationData');

    // Process the data schema properties
    const operationDataSchema: any = {
      type: 'object',
      description: 'Operation-specific configuration data',
      properties: {},
      additionalProperties: true,
    };

    // Extract required properties
    const requiredProps: string[] = [];

    for (const [propName, propSchema] of Object.entries(
      dataSchema.properties as Record<string, any>
    )) {
      // Check for @required tag in description or schema
      const isRequired =
        propSchema.description?.includes('@required') ||
        propSchema.required === true ||
        dataSchema.required?.includes(propName);

      // Check for @output tag - these are output properties, not input
      const isOutput =
        propSchema.description?.includes('@output') ||
        propSchema.output === true;

      // Clean up description (remove JSDoc tags)
      let cleanDescription = propSchema.description || '';
      cleanDescription = cleanDescription
        .replace(/@type=\S+/g, '')
        .replace(/@required/g, '')
        .replace(/@erased/g, '')
        .replace(/@output/g, '')
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
      if (propSchema.properties)
        processedProp.properties = propSchema.properties;
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
    }

    schema.properties.operationData = operationDataSchema;
  }

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

function typeNameToOperationName(typeName: string): string {
  // ISelectElementOperationData -> selectElement
  // Remove leading 'I' and trailing 'OperationData'
  let name = typeName;
  if (name.startsWith('I')) {
    name = name.substring(1);
  }
  if (name.endsWith('OperationData')) {
    name = name.substring(0, name.length - 'OperationData'.length);
  }
  // Convert to camelCase (first letter lowercase)
  return name.charAt(0).toLowerCase() + name.slice(1);
}

function camelCaseToDash(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
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
  _definitions: Record<string, any>
): Record<string, any> {
  // For operation schemas, we don't need any external definitions.
  // All operation data types are simple objects with primitive properties.
  // External types like JQuery, HTMLElement etc. are replaced with {type: "object"}
  return {};
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
  typeName: string
): any {
  // Create a minimal schema for operations with complex generic types
  // that ts-json-schema-generator cannot handle
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: `https://rolandzwaga.github.io/eligius/jsonschema/operations/${camelCaseToDash(operationName)}.json`,
    type: 'object',
    title: `${operationName} Operation`,
    description: `Schema for the ${operationName} operation (generated from ${typeName})`,
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
