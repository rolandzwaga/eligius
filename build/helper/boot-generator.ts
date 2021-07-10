import fs from 'fs';
import path from 'path';
import dashToCamelCase from './dashToCamelCase';

function generateBootSourceCode(
  config: any,
  basePath: string,
  configPath: string
) {
  const dirName = path.dirname(configPath);
  const configFileName = configPath.substr(dirName.length + 1);

  const bootSourceCode = _generateBootSource(
    config,
    basePath,
    configFileName,
    dirName
  );

  /*const ast = Parser.parse(bootSourceCode, {
    ecmaVersion: 6,
    sourceType: 'module',
  });
  const formattedCode = generate(ast);*/

  return bootSourceCode; //formattedCode;
}

function _generateBootSource(
  config: any,
  basePath: string,
  configFileName: string,
  dirName: string
) {
  const engineFactoryPath = path
    .join(basePath, 'engine-factory')
    .split('\\')
    .join('/');
  configFileName = '../' + configFileName;
  const cssPath = path.join(dirName, 'css');
  const templatePath = path.join(dirName, 'template');

  const lines = _generateCssImports(cssPath);

  lines.push(`import { IEngineConfiguration } from '../../../src';`);
  lines.push(`import * as engineConfig from './${configFileName}';`);
  lines.push(`import { EngineFactory } from '${engineFactoryPath}';`);
  lines.push(
    "import WebpackResourceImporter from './webpack-resource-importer';"
  );
  lines.push(
    'const factory = new EngineFactory(new WebpackResourceImporter(), window);'
  );
  lines.push(
    'const engine = factory.createEngine((engineConfig as any) as IEngineConfiguration);'
  );
  lines.push(
    "engine.init().then(()=> {console.log('Eligius engine ready for business');});"
  );

  return lines.join('\n');
}

function _generateCssImports(cssPath: string) {
  const entries = fs.readdirSync(cssPath);
  return entries.map(file => {
    const importName = `css_${dashToCamelCase(path.basename(file, '.css'))}`;
    return `import ${importName} from '../css/${file}';`;
  });
}

export default generateBootSourceCode;
