import dashToCamelCase from '@util/dash-to-camel-case.ts';
import {
  type ExportDeclarationStructure,
  type InterfaceDeclaration,
  Project,
  type SourceFile,
  StructureKind,
  ts,
} from 'ts-morph';
import {
  formatEventArgMetadata,
  getEventArgMetadata,
} from './event-arg-metadata.ts';
import {
  findEventFilesMissingFromIndex,
  getRequestEventNames,
  writeRequestMap,
} from './event-registry.ts';
import {escapeTemplateLiteral, getTag, removeGeneratedFiles} from './shared.ts';

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

const metadataDirectory = './src/eventbus/events/metadata';

/**
 * Whether the hand maintained `IEventMetadata` declares the `optional` flag
 * for its args. The flag is only emitted when it does, otherwise the generated
 * files would not type-check.
 */
const supportsOptionalArgs = (() => {
  const typesFile = project.addSourceFileAtPath(
    `${metadataDirectory}/types.ts`
  );
  const argType = typesFile
    .getInterface('IEventMetadata')
    ?.getProperty('args')
    ?.getType()
    .getArrayElementType();
  return argType?.getProperty('optional') !== undefined;
})();

const isPrivateEvent = (interfaceDecl: InterfaceDeclaration): boolean => {
  const docs = interfaceDecl.getJsDocs();
  return docs.some(doc =>
    doc.getTags().some(tag => tag.getTagName() === 'private')
  );
};

type TEventMetadataResult =
  | {status: 'failed'}
  | {status: 'private' | 'public'; iface: InterfaceDeclaration};

/**
 * Validates the event interface in the given file and writes its metadata file.
 * Private events (tagged `@private`) get no metadata file, but they are still
 * valid events and must stay part of the generated `EventMap`.
 */
const createEventMetadata = (sourceFile: SourceFile): TEventMetadataResult => {
  const interfaceDeclaration = sourceFile
    .getInterfaces()
    .find(iface => iface.isExported());

  if (!interfaceDeclaration) {
    console.error(
      `Can't find an exported interface in ${sourceFile.getBaseName()}`
    );
    return {status: 'failed'};
  }

  // Validate event interface structure
  const nameProperty = interfaceDeclaration.getProperty('name');
  const argsProperty = interfaceDeclaration.getProperty('args');

  if (!nameProperty || !argsProperty) {
    console.error(
      `Event interface ${interfaceDeclaration.getName()} in ${sourceFile.getBaseName()} must have 'name' and 'args' properties`
    );
    return {status: 'failed'};
  }

  // Private events are excluded from the metadata, not from the event types
  if (isPrivateEvent(interfaceDeclaration)) {
    console.log(
      `Skipping metadata for private event ${interfaceDeclaration.getName()} in ${sourceFile.getBaseName()}`
    );
    return {status: 'private', iface: interfaceDeclaration};
  }

  createSourceFile(interfaceDeclaration, sourceFile);
  return {status: 'public', iface: interfaceDeclaration};
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

  // Import the event interface. Top-level `import type { … }` (not inline
  // `import { type … }`) so it's fully elided — under verbatimModuleSyntax an
  // inline type specifier leaves a side-effect `import "./event"` that would pull
  // implementation code into the metadata-only bundle (`eligius/metadata`).
  outputSourceFile.addImportDeclaration({
    moduleSpecifier: `${EVENTBUS_EVENTS_ALIAS}/${fileName}.ts`,
    isTypeOnly: true,
    namedImports: [eventName],
  });

  // Import IEventMetadata
  outputSourceFile.addImportDeclaration({
    moduleSpecifier: `${EVENTBUS_EVENTS_ALIAS}/metadata/types.ts`,
    isTypeOnly: true,
    namedImports: ['IEventMetadata'],
  });

  // Extract function name (camelCase) from fileName
  const functionName = dashToCamelCase(fileName);

  outputSourceFile.addFunction({
    name: functionName,
    isExported: true,
    returnType: `IEventMetadata<${eventName}['args']>`,
    statements: writer => {
      writer.writeLine('return {');
      writer.writeLine(`description: \`${getDescription(interfaceDecl)}\`,`);
      writer.writeLine(
        `category: \`${escapeTemplateLiteral(getCategory(interfaceDecl))}\`,`
      );
      writer.writeLine(
        `args: [${formatEventArgMetadata(getEventArgMetadata(interfaceDecl), supportsOptionalArgs)}]`
      );
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
  return escapeTemplateLiteral(description);
};

const getCategory = (interfaceDecl: InterfaceDeclaration): string => {
  const docs = interfaceDecl.getJsDocs();
  const tag = getTag(docs)('category')?.getComment();
  if (typeof tag === 'string') {
    return tag;
  }
  return 'Unknown';
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
    outputSourceFile.addImportDeclaration({
      moduleSpecifier: `${EVENTBUS_EVENTS_ALIAS}/${fileName}.ts`,
      isTypeOnly: true,
      namedImports: [eventName],
    });
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

  // Create EventMap type. A request event (one with `returns`) keeps its
  // legacy broadcast form: its args followed by an optional result callback.
  outputSourceFile.addTypeAlias({
    name: 'EventMap',
    isExported: true,
    type: "{[K in AllEvents as K['name']]: K extends {returns: infer R} ? [...K['args'], callback?: (result: R) => void] : K['args']}",
  });

  // Create EventName type
  outputSourceFile.addTypeAlias({
    name: 'EventName',
    isExported: true,
    type: 'keyof EventMap',
  });

  // Create RequestMap from the request events
  writeRequestMap(
    outputSourceFile,
    getRequestEventNames(eventData.map(({iface}) => iface))
  );

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
    src =>
      src.getBaseName() !== 'index.ts' &&
      src.getBaseName() !== 'types.ts' &&
      !src.getFilePath().includes('/metadata/')
  );

// Every event file must be exported from the events index, otherwise it is
// missing from the public API.
const indexFile = project.getSourceFileOrThrow(
  './src/eventbus/events/index.ts'
);
const missingFromIndex = findEventFilesMissingFromIndex(
  eventFiles.map(file => file.getBaseName()),
  indexFile,
  EVENTBUS_EVENTS_ALIAS
);
if (missingFromIndex.length) {
  console.error(
    `src/eventbus/events/index.ts does not export these event file(s): ${missingFromIndex.join(', ')}. Add an \`export type {...} from '${EVENTBUS_EVENTS_ALIAS}/<file>.ts'\` line for each.`
  );
  process.exit(1);
}

// Remove the output of events that were renamed or removed
removeGeneratedFiles(metadataDirectory);

// Process all events. Every valid event goes into the types file, only the
// public ones get metadata.
const allEvents: Array<{iface: InterfaceDeclaration; sourceFile: SourceFile}> =
  [];
const publicEvents: Array<{
  iface: InterfaceDeclaration;
  sourceFile: SourceFile;
}> = [];
const failedFiles: string[] = [];
eventFiles.forEach(file => {
  let result: TEventMetadataResult;
  try {
    result = createEventMetadata(file);
  } catch (e) {
    console.error(
      `Failed to generate metadata for ${file.getBaseName()}: ${(e as Error).message}`
    );
    result = {status: 'failed'};
  }

  if (result.status === 'failed') {
    failedFiles.push(file.getBaseName());
    return;
  }

  allEvents.push({iface: result.iface, sourceFile: file});
  if (result.status === 'public') {
    publicEvents.push({iface: result.iface, sourceFile: file});
  }
});

// Generate metadata index file
toIndexFile(
  project,
  publicEvents.map(({sourceFile}) => sourceFile.getBaseName())
);

// Generate types file (EventMap, EventName, AllEvents)
toTypesFile(project, allEvents);

project.saveSync();

if (failedFiles.length) {
  console.error(
    `Metadata generation failed for ${failedFiles.length} event file(s): ${failedFiles.join(', ')}`
  );
  process.exit(1);
}

console.log('Ready.');
