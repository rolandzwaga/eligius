import fs from 'fs';
import path from 'path';

const docsJsonPath = path.resolve(__dirname, '../../docs.json');
const outputPath = path.resolve(__dirname, '../operation');

if (!fs.existsSync(docsJsonPath)) {
  console.error(`${docsJsonPath} not found!`);
  process.exit(1);
}

if (!fs.existsSync(outputPath)) {
  console.error(`Output path '${outputPath}' does not exist!`);
  process.exit(1);
}

const contents = fs.readFileSync(docsJsonPath, { encoding: 'utf-8' });
const docs = JSON.parse(contents);

const operationInfos = docs.children.filter(
  (x: any) =>
    x.kindString === 'Function' &&
    x.sources?.[0]?.fileName?.startsWith('operation/')
);

const header = ['# Operations'];
header.push(
  'This is a list of all the available operations with links to their respective documentation'
);

const readme = [...header, ...operationInfos.map(generateOperationLink)];

fs.writeFileSync(path.join(outputPath, 'README.md'), readme.join('\n\n'), {
  encoding: 'utf-8',
});

console.info(
  `${path.join(outputPath, 'README.md')} was written succesfully...`
);

function generateOperationLink(operationInfo: any) {
  return `- [${
    operationInfo.name
  }](https://rolandzwaga.github.io/eligius/functions/${
    operationInfo.name
  }.html${getFirstCommentLine(operationInfo)})`;
}

function getFirstCommentLine(operationInfo: any) {
  const signature = operationInfo.signatures.find(
    (x: any) => x.name === operationInfo.name
  );
  if (signature) {
    const line = signature.comment?.summary?.find(
      (x: any) => x.kind === 'text'
    );
    if (line) {
      return ` "${line.text.replaceAll('\r\n', ' ')}"`;
    }
  }
  return '';
}
