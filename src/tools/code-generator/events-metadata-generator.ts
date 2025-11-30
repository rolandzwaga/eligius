import dashToCamelCase from '@util/dash-to-camel-case.ts';
import {
  type ExportDeclarationStructure,
  type InterfaceDeclaration,
  type JSDoc,
  Project,
  type SourceFile,
  StructureKind,
  SyntaxKind,
  ts,
} from 'ts-morph';

/**
 * Path alias for eventbus events directory
 */
const EVENTBUS_EVENTS_ALIAS = '@eventbus/events';

const project = new Project({
  compilerOptions: {
    noEmit: true, // Prevent emitting .js/.d.ts files for source files
  },
  skipAddingFilesFromTsConfig: true, // Don't load files from tsconfig
});
project.addSourceFilesAtPaths('./src/eventbus/events/*.ts');

const isPrivateEvent = (interfaceDecl: InterfaceDeclaration): boolean => {
  const docs = interfaceDecl.getJsDocs();
  return docs.some(doc =>
    doc.getTags().some(tag => tag.getTagName() === 'private')
  );
};

const createEventMetadata = (sourceFile: SourceFile) => {
  const interfaceDeclaration = sourceFile
    .getInterfaces()
    .find(iface => iface.isExported());

  if (!interfaceDeclaration) {
    console.error(
      `Can't find an exported interface in ${sourceFile.getBaseName()}`
    );
    return;
  }

  // Skip private events
  if (isPrivateEvent(interfaceDeclaration)) {
    console.log(
      `Skipping private event ${interfaceDeclaration.getName()} in ${sourceFile.getBaseName()}`
    );
    return null;
  }

  // Validate event interface structure
  const nameProperty = interfaceDeclaration.getProperty('name');
  const argsProperty = interfaceDeclaration.getProperty('args');

  if (!nameProperty || !argsProperty) {
    console.error(
      `Event interface ${interfaceDeclaration.getName()} in ${sourceFile.getBaseName()} must have 'name' and 'args' properties`
    );
    return;
  }

  createSourceFile(interfaceDeclaration, sourceFile);
  return interfaceDeclaration;
};

const createSourceFile = (
  interfaceDecl: InterfaceDeclaration,
  eventSourceFile: SourceFile
) => {
  const eventName = interfaceDecl.getName();
  // Use the source file's basename (without .ts) as the filename
  const fileName = eventSourceFile.getBaseName().replace(/\.ts$/, '');
  const outputSourceFile = project.createSourceFile(
    `./src/eventbus/events/metadata/${fileName}.ts`,
    '',
    {overwrite: true}
  );

  // Import the event interface
  outputSourceFile
    .addImportDeclaration({
      moduleSpecifier: `${EVENTBUS_EVENTS_ALIAS}/${fileName}.ts`,
    })
    .addNamedImport({name: eventName, isTypeOnly: true});

  // Import IEventMetadata
  outputSourceFile
    .addImportDeclaration({
      moduleSpecifier: `${EVENTBUS_EVENTS_ALIAS}/metadata/types.ts`,
    })
    .addNamedImport({name: 'IEventMetadata', isTypeOnly: true});

  // Get args tuple from the interface property type node (not the type object)
  const argsProperty = interfaceDecl.getProperty('args')!;

  // Extract function name (camelCase) from fileName
  const functionName = dashToCamelCase(fileName);

  outputSourceFile.addFunction({
    name: functionName,
    isExported: true,
    returnType: `IEventMetadata<${eventName}['args']>`,
    statements: writer => {
      writer.writeLine('return {');
      writer.writeLine(`description: \`${getDescription(interfaceDecl)}\`,`);
      writer.writeLine(`category: \`${getCategory(interfaceDecl)}\`,`);
      writer.writeLine(`args: [${getArgMetadata(argsProperty)}]`);
      writer.writeLine('};');
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

const getDescription = (interfaceDecl: InterfaceDeclaration): string => {
  const description = interfaceDecl
    .getJsDocs()
    .map(x => x.getCommentText())
    .join('');
  return description?.replaceAll('`', '\\`') || '';
};

const getCategory = (interfaceDecl: InterfaceDeclaration): string => {
  const docs = interfaceDecl.getJsDocs();
  const tag = getTag(docs)('category')?.getComment();
  if (typeof tag === 'string') {
    return tag;
  }
  return 'Unknown';
};

const getArgMetadata = (argsProperty: any): string => {
  // Get the type node (AST node) instead of the type (type-checker type)
  const typeNode = argsProperty.getTypeNode();

  if (!typeNode || typeNode.getKind() !== SyntaxKind.TupleType) {
    return '';
  }

  const elements = typeNode.getElements();

  if (elements.length === 0) {
    return '';
  }

  return elements
    .map((element: any, index: number) => {
      let name = `arg${index}`;
      let type = 'unknown';

      // Check if this is a named tuple member
      if (element.getKind() === SyntaxKind.NamedTupleMember) {
        name = element.getName();
        const typeNode = element.getTypeNode();
        type = typeNode ? typeNode.getText() : 'unknown';
      } else {
        // Regular tuple element (no name)
        type = element.getText();
      }

      // Try to find @param JSDoc for this argument
      const description = ''; // We'll add @param support later if needed

      return `
      {
        name: '${name}',
        type: '${type}'${description ? `,\n        description: '${description}'` : ''}
      }`;
    })
    .join(',');
};

const getTag = (docs: JSDoc[]) => (tagName: string) => {
  return docs.flatMap(d => d.getTags()).find(t => t.getTagName() === tagName);
};

const toIndexFile = (project: Project, fileNames: string[]) => {
  const outputSourceFile = project.createSourceFile(
    `./src/eventbus/events/metadata/index.ts`,
    '',
    {overwrite: true}
  );
  outputSourceFile.addExportDeclarations(
    fileNames.map(name => {
      const namedExport = dashToCamelCase(name.slice(0, -3));
      return {
        kind: StructureKind.ExportDeclaration,
        moduleSpecifier: `${EVENTBUS_EVENTS_ALIAS}/metadata/${name}`,
        namedExports: [namedExport],
      } as ExportDeclarationStructure;
    })
  );
  outputSourceFile.addExportDeclaration({
    moduleSpecifier: `${EVENTBUS_EVENTS_ALIAS}/metadata/types.ts`,
  });
};

const toTypesFile = (
  project: Project,
  eventData: Array<{iface: InterfaceDeclaration; sourceFile: SourceFile}>
) => {
  const outputSourceFile = project.createSourceFile(
    `./src/eventbus/events/types.ts`,
    '',
    {overwrite: true}
  );

  // Import all event interfaces
  eventData.forEach(({iface, sourceFile}) => {
    const eventName = iface.getName();
    const fileName = sourceFile.getBaseName().replace(/\.ts$/, '');
    outputSourceFile
      .addImportDeclaration({
        moduleSpecifier: `${EVENTBUS_EVENTS_ALIAS}/${fileName}.ts`,
      })
      .addNamedImport({name: eventName, isTypeOnly: true});
  });

  // Create AllEvents union type
  outputSourceFile.addTypeAlias({
    name: 'AllEvents',
    isExported: true,
    type: writer => {
      const names = eventData.map(({iface}) => iface.getName());
      if (names.length === 0) {
        writer.write('never');
      } else if (names.length === 1) {
        writer.write(names[0]);
      } else {
        writer.writeLine(names.join('\n  | '));
      }
    },
  });

  // Create EventMap type
  outputSourceFile.addTypeAlias({
    name: 'EventMap',
    isExported: true,
    type: "{[K in AllEvents as K['name']]: K['args']}",
  });

  // Create EventName type
  outputSourceFile.addTypeAlias({
    name: 'EventName',
    isExported: true,
    type: 'keyof EventMap',
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

const eventFiles = project
  .getSourceFiles()
  .filter(
    src => src.getBaseName() !== 'index.ts' && src.getBaseName() !== 'types.ts'
  );

// Process all events and collect non-private interfaces with their source files
const eventData: Array<{iface: InterfaceDeclaration; sourceFile: SourceFile}> =
  [];
eventFiles.forEach(file => {
  const result = createEventMetadata(file);
  if (result) {
    eventData.push({iface: result, sourceFile: file});
  }
});

// Generate metadata index file
toIndexFile(
  project,
  eventData.map(({sourceFile}) => {
    const fileName = sourceFile.getBaseName();
    return fileName;
  })
);

// Generate types file (EventMap, EventName, AllEvents)
toTypesFile(project, eventData);

project.saveSync();

console.log('Ready.');
