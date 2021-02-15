const path = require('path');
const fs = require('fs');
const camelCaseToDash = require('./camelCaseToDash');
const dashToCamelCase = require('./dashToCamelCase');
const formatTypescript = require('./format-typescript');

function generateImporterSourceCode(config, basePath, configPath) {
  const importPaths = _gatherImportPaths(config, basePath, configPath);

  const importerSourceCode = _generateSourceCode(importPaths);

  return formatTypescript(importerSourceCode);
}

function _generateSourceCode(importPaths) {
  const result = importPaths.map((imp) => {
    const p = imp.path.split('\\').join('/');
    if (imp.defaultImport) {
      return `const ${imp.systemName} = require('${p}');`;
    }
    return `import { ${imp.systemName} } from '${p}';`;
  });
  result.push(`import { ISimpleResourceImporter } from '../../../src';`);
  result.push('class WebpackResourceImporter implements ISimpleResourceImporter {');
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

function _gatherImportPaths(config, basePath, configPath) {
  const importPaths = [];
  importPaths.push(..._gatherOperations(config, basePath));
  importPaths.push(..._gatherAssets(configPath, 'template', '.html'));
  importPaths.push(..._gatherAssets(configPath, 'json', '.json'));
  importPaths.push(..._gatherControllers(config, basePath));
  importPaths.push(..._gatherProviders(config, basePath));
  importPaths.push(..._gatherEngines(config, basePath));
  return importPaths;
}

function _gatherAssets(assetPath, subdir, extension) {
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

function _gatherControllers(config, basePath) {
  let importPaths = [];
  importPaths.push(..._gatherControllerImportPathsFromActions(config.initActions, basePath));
  importPaths.push(..._gatherControllerImportPathsFromActions(config.actions, basePath));
  importPaths.push(..._gatherControllerImportPathsFromActions(config.timelineActions, basePath));
  importPaths.push(..._gatherControllerImportPathsFromActions(config.eventActions, basePath));
  importPaths = dedupe(importPaths);
  return importPaths;
}

function _gatherProviders(config, basePath) {
  if (config.timelineProviderSettings) {
    basePath = path.join(basePath, 'timelineproviders');
    return Object.values(config.timelineProviderSettings).map((settings) => {
      return {
        systemName: settings.systemName,
        path: path.join(basePath, camelCaseToDash(settings.systemName)),
      };
    });
  }
  return [];
}

function _gatherEngines(config, basePath) {
  if (config.engine) {
    const { systemName } = config.engine;
    return [
      {
        systemName: systemName,
        path: path.join(basePath, camelCaseToDash(systemName)),
      },
    ];
  }
  return [];
}

function _gatherOperations(config, basePath) {
  let importPaths = [];
  importPaths.push(..._gatherOperationImportPathsFromActions(config.initActions, basePath));
  importPaths.push(..._gatherOperationImportPathsFromActions(config.actions, basePath));
  if (config.timelines) {
    config.timelines.forEach((timeline) => {
      importPaths.push(..._gatherOperationImportPathsFromActions(timeline.timelineActions, basePath));
    });
  }
  importPaths.push(..._gatherOperationImportPathsFromActions(config.eventActions, basePath));
  importPaths = dedupe(importPaths);
  return importPaths;
}

function dedupe(importPaths) {
  const lookup = {};
  return importPaths.filter((imp) => {
    if (lookup[imp.systemName]) {
      return false;
    }
    lookup[imp.systemName] = true;
    return true;
  });
}

function _gatherControllerImportPathsFromActions(actionsConfig, basePath) {
  if (!actionsConfig) {
    return [];
  }
  const controllerPath = path.join(basePath, 'controllers');
  const importPaths = [];
  actionsConfig.forEach((actionConfig) => {
    importPaths.push(..._gatherControllerImportPaths(actionConfig.startOperations, controllerPath));
    importPaths.push(..._gatherControllerImportPaths(actionConfig.endOperations, controllerPath));
  });
  return importPaths;
}

function _gatherOperationImportPathsFromActions(actionsConfig, basePath) {
  if (!actionsConfig) {
    return [];
  }
  const operationPath = path.join(basePath, 'operation');
  const importPaths = [];
  actionsConfig.forEach((actionConfig) => {
    importPaths.push(..._gatherOperationImportPaths(actionConfig.startOperations, operationPath));
    importPaths.push(..._gatherOperationImportPaths(actionConfig.endOperations, operationPath));
  });
  return importPaths;
}

function _gatherControllerImportPaths(operationConfigs, basePath) {
  if (!operationConfigs) {
    return [];
  }
  return operationConfigs
    .filter((operationConfig) => {
      if (operationConfig.operationData && operationConfig.operationData.hasOwnProperty('systemName')) {
        return operationConfig.operationData.systemName.endsWith('Controller');
      }
      return false;
    })
    .map((operationConfig) => {
      const { systemName } = operationConfig.operationData;
      return {
        systemName: systemName,
        path: path.join(basePath, camelCaseToDash(systemName)),
      };
    });
}

function _gatherOperationImportPaths(operationConfigs, basePath) {
  if (!operationConfigs) {
    return [];
  }
  return operationConfigs.map((operationConfig) => {
    const { systemName } = operationConfig;
    return {
      systemName: systemName,
      path: path.join(basePath, camelCaseToDash(systemName)),
    };
  });
}

module.exports = generateImporterSourceCode;
