// @vitest-environment node
import fs from 'node:fs';
import path from 'node:path';
import {describe, expect, test} from 'vitest';

const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'package.json'), {
    encoding: 'utf-8',
  })
) as {scripts: Record<string, string>};

describe('package.json scripts', () => {
  test('given the typedoc script, when it is split on shell control operators, then it has no lone & that would background the docs.json run under POSIX sh', () => {
    // given
    const script = packageJson.scripts.typedoc;

    // test
    // Remove the && and || operators, any & left over is a lone background operator
    const withoutSequenceOperators = script.replace(/&&|\|\|/g, '');

    // expect
    expect(withoutSequenceOperators).not.toContain('&');
    expect(script.indexOf('typedoc-metadata.json')).toBeLessThan(
      script.indexOf('typedoc.json')
    );
  });

  test('given the scripts, when looking for the uvu to vitest codemod, then it is gone', () => {
    // expect
    expect(packageJson.scripts.codemod).toBeUndefined();
  });
});
