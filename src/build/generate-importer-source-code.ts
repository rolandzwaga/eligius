import fs from 'fs';
import path from 'path';
import {
  IActionConfiguration,
  IEndableActionConfiguration,
  IEngineConfiguration,
  IOperationConfiguration,
} from '../configuration/types';
import dashToCamelCase from '../util/dash-to-camel-case';

interface ImportInfo {
  systemName: string;
  path?: string;
  defaultImport?: boolean;
}

export interface IAssetInfo {
  path: string;
  extension: string;
}

/**
 * This function takes an Eligius engine configuration, a root path for the config and an arbitrary list of asset info.
 * The asset info determines a number of subdirectories in the root path that contain the different assets used by the presentation.
 * I.e. html, json, etc.
 *
 * @param config
 * @param configPath
 * @param assetInfo
 */
export function generateImporterSourceCode(
  config: IEngineConfiguration,
  configPath: string,
  assetInfo: IAssetInfo[]
) {
  const importPaths = _gatherImportPaths(config, configPath, assetInfo);

  const importerSourceCode = _generateSourceCode(importPaths);

  return importerSourceCode;
}

function _generateSourceCode(importPaths: ImportInfo[]) {
  const result = importPaths
    .filter((x) => x.defaultImport)
    .map((imp) => `import ${imp.systemName} from '${imp.path}';`)
    .concat(
      importPaths
        .filter((x) => !x.defaultImport)
        .map(
          (imp) => `import {${imp.systemName}} from '${imp.path ?? 'eligius'}';`
        )
    );
  result.push(`import { ISimpleResourceImporter } from 'eligius';`);
  result.push('');

  result.push('const imports: Record<string, any> = {');
  result.push(
    ...importPaths.map(
      (imp) => `${imp.systemName}: { '${imp.systemName}': ${imp.systemName} },`
    )
  );
  result.push('};');
  result.push('');
  result.push(
    'class EligiusResourceImporter implements ISimpleResourceImporter {'
  );
  result.push('import(name: string): Record<string, any> {');
  result.push('if (imports.hasOwnProperty(name)) { return imports[name]; }');
  result.push('throw Error(`Unknown systemName: ${name}`);');
  result.push('}}');
  result.push('');
  result.push('export default EligiusResourceImporter;');

  return result.join('\n');
}

function _gatherImportPaths(
  config: IEngineConfiguration,
  configPath: string,
  assetInfo: IAssetInfo[]
): ImportInfo[] {
  return [
    ..._gatherOperations(config),
    ...assetInfo.flatMap((info) =>
      _gatherAssets(configPath, info.path, info.extension)
    ),
    ..._gatherControllers(config),
    ..._gatherProviders(config),
    ..._gatherEngines(config),
  ];
}

function _gatherAssets(assetPath: string, subdir: string, extension: string) {
  const entries = fs.readdirSync(path.join(assetPath, subdir));
  return entries.map((file) => {
    const importName = `${dashToCamelCase(path.basename(file, extension))}`;
    return {
      systemName: importName,
      path: `./${subdir}/${file}`,
      defaultImport: true,
    };
  });
}

function _gatherControllers(config: IEngineConfiguration) {
  let importPaths = [] as [] as ImportInfo[];
  importPaths.push(
    ..._gatherControllerImportPathsFromActions(config.initActions)
  );
  importPaths.push(..._gatherControllerImportPathsFromActions(config.actions));
  importPaths.push(
    ..._gatherControllerImportPathsFromActions(
      config.timelines.flatMap((x) => x.timelineActions)
    )
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

function _gatherOperations(config: IEngineConfiguration): ImportInfo[] {
  let importPaths = _gatherOperationImportPathsFromActions(
    config.initActions
      .concat(config.actions)
      .concat(config.eventActions ?? ([] as any[]))
  );

  if (config.timelines) {
    const timelineActions = config.timelines.flatMap((x) => x.timelineActions);

    importPaths = importPaths.concat(
      _gatherOperationImportPathsFromActions(timelineActions)
    );
  }

  return dedupe(importPaths);
}

function _gatherControllerImportPathsFromActions(
  actionsConfig?: IActionConfiguration[] | IEndableActionConfiguration[]
): ImportInfo[] {
  if (!actionsConfig) {
    return [] as ImportInfo[];
  }

  const operations = actionsConfig.flatMap((x) => [
    ...x.startOperations,
    ...((x as any).endOperations ?? []),
  ]);

  return _gatherControllerImportPaths(operations);
}

function _gatherOperationImportPathsFromActions(
  actionsConfig?: IActionConfiguration[] | IEndableActionConfiguration[]
): ImportInfo[] {
  if (!actionsConfig) {
    return [] as ImportInfo[];
  }

  const operations = actionsConfig.flatMap((x) => [
    ...x.startOperations,
    ...((x as any).endOperations ?? []),
  ]);

  return _gatherOperationImportPaths(operations);
}

function _gatherControllerImportPaths(
  operationConfigs: IOperationConfiguration[]
): ImportInfo[] {
  if (!operationConfigs) {
    return [] as ImportInfo[];
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
    return [] as ImportInfo[];
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
