import { createProject, ts } from '@ts-morph/bootstrap';
import { expect } from 'chai';
import fs, { PathLike } from 'fs';
import { suite } from 'uvu';
import { generateImporterSourceCode } from '../../../build';
import { ConfigurationFactory } from '../../../configuration/api';
import { IEngineConfiguration } from '../../../configuration/types';

const GenerateImporterSourceCodeSuite = suite('generateImporterSourceCode');

GenerateImporterSourceCodeSuite.before((context) => {
  context.readdirSync = fs.readdirSync;
  (fs as any).readdirSync = (path: PathLike, _options?: any) => {
    if ((path as string).endsWith('html')) {
      return ['test1.html', 'test2.html'];
    }
    return [];
  };
});

GenerateImporterSourceCodeSuite.after((context) => {
  fs.readdirSync = context.readdirSync;
});

// TODO: create some actual useful unit tests for this...
GenerateImporterSourceCodeSuite('should generate source code', async () => {
  const factory = new ConfigurationFactory().init('nl-NL');

  let config: IEngineConfiguration | undefined;
  factory.getConfiguration((cfg) => (config = cfg));

  const tsSource = generateImporterSourceCode(
    config as IEngineConfiguration,
    './mypath',
    [{ path: 'html', extension: '.html' }]
  );

  const project = await createProject({ useInMemoryFileSystem: true });
  project.createSourceFile('importer.ts', tsSource);
  const program = project.createProgram();
  const diagnostics = ts
    .getPreEmitDiagnostics(program)
    .filter((x) => x.code !== 2307); //Filter out the cannot find module errors

  expect(diagnostics.length).to.equal(0);
});

GenerateImporterSourceCodeSuite.run();
