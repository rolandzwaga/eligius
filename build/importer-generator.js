const path = require('path');
const { Parser } = require("acorn");
const { generate } = require('astring');

function generateImporter(config, basePath) {

    const importPaths = _gatherImportPaths(config, basePath);

    const importerSourceCode = _generateSourceCode(importPaths);

    const ast = Parser.parse(importerSourceCode, { ecmaVersion: 6, sourceType: 'module' });
    const formattedCode = generate(ast);

    console.log(formattedCode);

    return formattedCode;
}

function _generateSourceCode(importPaths) {
    const result = importPaths.map((imp)=> {
        const p = imp.path.split("\\").join("\/");
        return `import ${imp.systemName} from '${p}';`;
    });
    result.push('class WebpackResourceImporter {');
    result.push('import(name) {');
    result.push('switch(true) {');
    result.push(...importPaths.map((imp)=> {
        return `case name === '${imp.systemName}': return { [name]: ${imp.systemName} };`
    }));
    result.push(`default: throw Error("Unknown systemName: " + name);`);
    result.push('}');
    result.push('}');
    result.push('}');
    result.push('export default WebpackResourceImporter;');
    return result.join('');
}

function _gatherImportPaths(config, basePath) {
    const importPaths = [];
    importPaths.push(..._gatherOperations(config, basePath));
    importPaths.push(..._gatherControllers(config, basePath));
    importPaths.push(..._gatherProviders(config, basePath));
    importPaths.push(..._gatherEngines(config, basePath));
    return importPaths;
}

function _gatherControllers(config, basePath) {
    return [];
}

function _gatherProviders(config, basePath) {
    return [];
}

function _gatherEngines(config, basePath) {
    return[];
}

function _gatherOperations(config, basePath) {
    let importPaths = [];
    importPaths.push(..._gatherOperationImportPathsFromActions(config.initActions, basePath));
    importPaths.push(..._gatherOperationImportPathsFromActions(config.actions, basePath));
    importPaths.push(..._gatherOperationImportPathsFromActions(config.timelineActions, basePath));
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

function _gatherOperationImportPaths(operationConfigs, basePath) {
    if (!operationConfigs) {
        return [];
    }
    return operationConfigs.map((operationConfig) => {
        return {
            systemName: operationConfig.systemName,
            path: path.join(basePath, operationConfig.systemName)
        };
    });
}

module.exports = generateImporter;