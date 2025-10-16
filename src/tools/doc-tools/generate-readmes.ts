import fs from 'node:fs';
import { EOL } from 'node:os';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import camelCaseToDash from '../../util/camel-case-to-dash.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const docsJsonPath = path.resolve(__dirname, '../../../docs.json');
const operationsReadMeoutputPath = path.resolve(__dirname, '../../operation');
const controllersReadMeoutputPath = path.resolve(
  __dirname,
  '../../controllers'
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

const contents = fs.readFileSync(docsJsonPath, { encoding: 'utf-8' });
const docs = JSON.parse(contents);

writeOperationsReadMe();
writeControllersReadMe();

function writeOperationsReadMe() {
  const operationInfos = docs.children.filter(
    (x: any) =>
      x.kindString === 'Function' &&
      x.sources?.[0]?.fileName?.startsWith('operation/')
  );

  const header = ['# Operations'];
  header.push(
    'This is a list of all the available operations with links to their respective documentation'
  );

  const readme = [
    ...header,
    ...operationInfos.map(generateLink.bind(null, 'functions')),
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
  const controllerInfos = docs.children.filter(
    (x: any) =>
      x.kindString === 'Class' &&
      x.sources?.[0]?.fileName?.startsWith('controllers/')
  );

  const header = ['# Controllers'];
  header.push(
    'This is a list of all the available controllers with links to their respective documentation'
  );

  const readme = [
    ...header,
    ...controllerInfos.map(generateLink.bind(null, 'classes')),
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

function generateLink(linkSuffix: string, itemInfo: any) {
  if (linkSuffix === 'functions') {
    return `- [${itemInfo.name
      }](https://rolandzwaga.github.io/eligius/${linkSuffix}/${itemInfo.name
      }.html${getFirstCommentLine(
        itemInfo
      )}) - ([schema](https://rolandzwaga.github.io/eligius/jsonschema/operations/${camelCaseToDash(
        itemInfo.name
      )}.json))`;
  }

  return `- [${itemInfo.name
    }](https://rolandzwaga.github.io/eligius/${linkSuffix}/${itemInfo.name
    }.html${getFirstCommentLine(itemInfo)})`;
}

function getFirstCommentLine(itemInfo: any) {
  const signature = itemInfo.signatures?.find(
    (x: any) => x.name === itemInfo.name
  );
  if (signature) {
    const line = signature.comment?.summary?.find(
      (x: any) => x.kind === 'text'
    );
    if (line) {
      return ` "${line.text.replaceAll(EOL, ' ')}"`;
    }
  }
  return '';
}
