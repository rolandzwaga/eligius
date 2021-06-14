import { Project } from 'ts-morph';

export default function formatTypescript(sources: string) {
  const project = new Project();

  const sourceFile = project.createSourceFile('sources.ts', sources);

  sourceFile.formatText({
    placeOpenBraceOnNewLineForFunctions: true,
    indentSize: 2,
    indentStyle: 2,
  });

  return sourceFile.getFullText();
}
