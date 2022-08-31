import fs from 'fs';
import path from 'path';
import dashToCamelCase from './dashToCamelCase';
import formatTypescript from './format-typescript';

interface ImportInfo {
  systemName: string;
  path?: string;
  defaultImport?: boolean;
}

export default function generateImporterSourceCode(
  config: any,
  configPath: string
) {
  const importPaths = _gatherImportPaths(config, configPath);

  const importerSourceCode = _generateSourceCode(importPaths);

  return formatTypescript(importerSourceCode);
}

function _generateSourceCode(importPaths: any[]) {
  const result = importPaths.map((imp) => {
    const importPath = imp.path ? imp.path : '../../../dist';
    if (imp.defaultImport) {
      return `import ${imp.systemName} from '${importPath}';`;
    }
    return `import { ${imp.systemName} } from '${importPath}';`;
  });
  result.push(`import { ISimpleResourceImporter } from '../../../dist';`);
  result.push(
    'class WebpackResourceImporter implements ISimpleResourceImporter {'
  );
  result.push('import(name: string): Record<string, any> {');
  result.push('switch(true) {');
  result.push(
    ...importPaths.map((imp) => {
      return `case name === '${imp.systemName}': return { [name]: ${imp.systemName} };`;
    })
  );
  result.push(`default: throw Error("Unknown systemName: " + name);`);
  result.push('}}}');
  result.push('export default WebpackResourceImporter;');
  return result.join('\n');
}

function _gatherImportPaths(config: any, configPath: string): ImportInfo[] {
  return ([] as ImportInfo[])
    .concat(_gatherOperations(config))
    .concat(_gatherAssets(configPath, 'template', '.html'))
    .concat(_gatherAssets(configPath, 'json', '.json'))
    .concat(_gatherControllers(config))
    .concat(_gatherProviders(config))
    .concat(_gatherEngines(config));
}

function _gatherAssets(assetPath: string, subdir: string, extension: string) {
  const entries = fs.readdirSync(path.join(assetPath, subdir));
  return entries.map((file) => {
    const importName = `${dashToCamelCase(path.basename(file, extension))}`;
    return {
      systemName: importName,
      path: `../${subdir}/${file}`,
      defaultImport: true,
    };
  });
}

function _gatherControllers(config: any) {
  let importPaths = [] as [] as ImportInfo[];
  importPaths.push(
    ..._gatherControllerImportPathsFromActions(config.initActions)
  );
  importPaths.push(..._gatherControllerImportPathsFromActions(config.actions));
  importPaths.push(
    ..._gatherControllerImportPathsFromActions(config.timelineActions)
  );
  importPaths.push(
    ..._gatherControllerImportPathsFromActions(config.eventActions)
  );
  importPaths = dedupe(importPaths);
  return importPaths;
}

function _gatherProviders(config: any) {
  if (config.timelineProviderSettings) {
    return Object.values(config.timelineProviderSettings).map<ImportInfo>(
      (settings: any) => {
        return {
          systemName: settings.systemName,
        };
      }
    );
  }
  return [] as ImportInfo[];
}

function _gatherEngines(config: any) {
  if (config.engine) {
    const { systemName } = config.engine;
    return [
      {
        systemName,
      },
    ];
  }
  return [];
}

function _gatherOperations(config: any): ImportInfo[] {
  let importPaths = ([] as [] as ImportInfo[])
    .concat(_gatherOperationImportPathsFromActions(config.initActions))
    .concat(_gatherOperationImportPathsFromActions(config.actions));

  if (config.timelines) {
    importPaths = config.timelines.reduce(
      (imports: ImportInfo[], timeline: any) => {
        return imports.concat(
          _gatherOperationImportPathsFromActions(timeline.timelineActions)
        );
      },
      importPaths
    );
  }

  return dedupe(
    importPaths.concat(
      _gatherOperationImportPathsFromActions(config.eventActions)
    )
  );
}

function _gatherControllerImportPathsFromActions(actionsConfig: any[]): any[] {
  if (!actionsConfig) {
    return [];
  }

  return actionsConfig.reduce((importPaths, actionConfig) => {
    return importPaths
      .concat(_gatherControllerImportPaths(actionConfig.startOperations))
      .concat(_gatherControllerImportPaths(actionConfig.endOperations));
  }, []);
}

function _gatherOperationImportPathsFromActions(
  actionsConfig: any[]
): ImportInfo[] {
  if (!actionsConfig) {
    return [];
  }

  return actionsConfig.reduce((importPaths, actionConfig) => {
    return importPaths
      .concat(_gatherOperationImportPaths(actionConfig.startOperations))
      .concat(_gatherOperationImportPaths(actionConfig.endOperations));
  }, []) as ImportInfo[];
}

function _gatherControllerImportPaths(operationConfigs: any[]): ImportInfo[] {
  if (!operationConfigs) {
    return [];
  }

  return operationConfigs
    .filter((operationConfig) => {
      if (operationConfig.operationData?.hasOwnProperty('systemName')) {
        return operationConfig.operationData.systemName.endsWith('Controller');
      }
      return false;
    })
    .map((operationConfig) => {
      const { systemName } = operationConfig.operationData;
      return {
        systemName,
      };
    });
}

function _gatherOperationImportPaths(operationConfigs: any[]): ImportInfo[] {
  if (!operationConfigs) {
    return [];
  }

  return operationConfigs.map((operationConfig) => {
    const { systemName } = operationConfig;
    return {
      systemName,
    };
  });
}

function dedupe(importPaths: ImportInfo[]): ImportInfo[] {
  const lookup: Record<string, true> = {};
  return importPaths.filter((imp) => {
    if (lookup[imp.systemName]) {
      return false;
    }
    lookup[imp.systemName] = true;
    return true;
  });
}
