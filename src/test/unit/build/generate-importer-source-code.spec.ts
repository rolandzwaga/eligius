import fs, { type PathLike } from 'node:fs';
import { createProject, ts } from '@ts-morph/bootstrap';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, type TestContext, test } from 'vitest';
import { generateImporterSourceCode } from '../../../build/index.ts';
import { ConfigurationFactory } from '../../../configuration/api/index.ts';

type CustomContext = {
  readdirSync: any;
} & TestContext;
function withContext<T>(ctx: unknown): asserts ctx is T { }
describe.concurrent<CustomContext>('generateImporterSourceCode', () => {
  beforeEach<CustomContext>(context => {
    withContext(context);

    context.readdirSync = fs.readdirSync;
    (fs as any).readdirSync = (path: PathLike, _options?: any) => {
      if ((path as string).endsWith('html')) {
        return ['test1.html', 'test2.html'];
      }
      return [];
    };
  });
  afterEach<CustomContext>(context => {
    withContext(context);

    fs.readdirSync = context.readdirSync;
  });
  test<CustomContext>('should generate source code', async () => {
    const factory = new ConfigurationFactory().init('nl-NL');

    const config = factory.getConfiguration();

    const tsSource = generateImporterSourceCode(config, './mypath', [
      { path: 'html', extension: '.html' },
    ]);

    const project = await createProject({ useInMemoryFileSystem: true });
    project.createSourceFile('importer.ts', tsSource);
    const program = project.createProgram();
    const diagnostics = ts
      .getPreEmitDiagnostics(program)
      .filter(x => x.code !== 2307); //Filter out the cannot find module errors

    expect(diagnostics.length).to.equal(0);
  });
});
