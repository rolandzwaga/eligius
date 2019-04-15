const path = require('path');
const fs = require('fs');
const { Parser } = require("acorn");
const { generate } = require('astring');

function generateBootSourceCode(config, basePath, configPath) {
    const dirName = path.dirname(configPath);
    const configFileName = configPath.substr(dirName.length+1);
    const cssPath = path.join(dirName, 'css');

    const bootSourceCode = _generateBootSource(config, basePath, configFileName, cssPath);

    const ast = Parser.parse(bootSourceCode, { ecmaVersion: 6, sourceType: 'module' });
    const formattedCode = generate(ast);

    return formattedCode;
}

function _generateBootSource(config, basePath, configFileName, cssPath) {
    const engineFactoryPath = path.join(basePath, 'engine-factory').split('\\').join('\/');
    configFileName = '../' + configFileName;
    const lines = _generateCssImports(cssPath);

    lines.push(`const engineConfig = require('${configFileName}');`);
    lines.push(`import EngineFactory from '${engineFactoryPath}';`);
    lines.push('import WebpackResourceImporter from \'./webpack-resource-importer\';');
    lines.push('const factory = new EngineFactory(new WebpackResourceImporter(), window);');
    lines.push('const engine = factory.createEngine(engineConfig);');
    lines.push('engine.init().then(()=> {console.log(\'chrono trigger engine ready for business\');});');
    
    return lines.join('');
}

function _generateCssImports(cssPath) {
    const entries = fs.readdirSync(cssPath);
    return entries.map(file => {
        const importName = `css_${path.basename(file, '.css')}`;
        return `import ${importName} from '../css/${file}';`;
    });
}

module.exports = generateBootSourceCode;
