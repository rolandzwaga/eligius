const Project = require('ts-morph').Project;

function formatTypescript(sources) {
  const project = new Project();

  const sourceFile = project.createSourceFile('sources.ts', sources);

  sourceFile.formatText({
    placeOpenBraceOnNewLineForFunctions: true,
    indentSize: 2,
    indentStyle: 2,
  });

  return sourceFile.getFullText();
}

module.exports = formatTypescript;
