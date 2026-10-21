import fs from 'node:fs';
import path, {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import type {JSONOutput} from 'typedoc';
import {generateLink, type IReadMeItemInfo} from './readme-links.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const docsJsonPath = path.resolve(__dirname, '../../../docs.json');
const operationsReadMeoutputPath = path.resolve(__dirname, '../../operation');
const controllersReadMeoutputPath = path.resolve(
  __dirname,
  '../../controllers'
);
const operationSchemasPath = path.resolve(
  __dirname,
  '../../../jsonschema/operations'
);

if (!fs.existsSync(docsJsonPath)) {
  console.error(`${docsJsonPath} not found!`);
  process.exit(1);
}

if (!fs.existsSync(operationsReadMeoutputPath)) {
  console.error(`Output path '${operationsReadMeoutputPath}' does not exist!`);
  process.exit(1);
}

if (!fs.existsSync(controllersReadMeoutputPath)) {
  console.error(`Output path '${controllersReadMeoutputPath}' does not exist!`);
  process.exit(1);
}

const contents = fs.readFileSync(docsJsonPath, {encoding: 'utf-8'});
const docs = JSON.parse(contents) as JSONOutput.ProjectReflection;

writeOperationsReadMe();
writeControllersReadMe();

function writeOperationsReadMe() {
  const operationInfos = docs.children!.filter(
    x => x.kind === 32 && x.sources?.[0]?.fileName?.startsWith('operation/')
  );

  const header = ['# Operations'];
  header.push(
    'This is a list of all the available operations with links to their respective documentation'
  );

  const readme = [
    ...header,
    ...operationInfos.map(info =>
      generateLink('variables', info as IReadMeItemInfo, hasOperationSchema)
    ),
  ];

  fs.writeFileSync(
    path.join(operationsReadMeoutputPath, 'README.md'),
    readme.join('\n\n'),
    {
      encoding: 'utf-8',
    }
  );

  console.info(
    `${path.join(
      operationsReadMeoutputPath,
      'README.md'
    )} was written succesfully...`
  );
}

function writeControllersReadMe() {
  const controllerInfos = docs.children!.filter(
    x => x.kind === 128 && x.sources?.[0]?.fileName?.startsWith('controllers/')
  );

  const header = ['# Controllers'];
  header.push(
    'This is a list of all the available controllers with links to their respective documentation'
  );

  const readme = [
    ...header,
    ...controllerInfos.map(info =>
      generateLink('classes', info as IReadMeItemInfo)
    ),
  ];

  fs.writeFileSync(
    path.join(controllersReadMeoutputPath, 'README.md'),
    readme.join('\n\n'),
    {
      encoding: 'utf-8',
    }
  );

  console.info(
    `${path.join(
      controllersReadMeoutputPath,
      'README.md'
    )} was written succesfully...`
  );
}

/**
 * Operations only get a schema link when `npm run generate-schema` wrote a schema for them.
 */
function hasOperationSchema(schemaFileName: string) {
  return fs.existsSync(path.join(operationSchemasPath, schemaFileName));
}
